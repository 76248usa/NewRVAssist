import ExpoModulesCore
import ARKit
import UIKit

private final class RvLidarDepthReader: NSObject, ARSessionDelegate {
  private let session = ARSession()
  private var pendingPromise: Promise?
  private var timeoutWorkItem: DispatchWorkItem?
  private var frameCountAfterRequest = 0
  private var sessionIsRunning = false
  private var readingRequestId = 0

  func getCenterDepthReading(promise: Promise) {
    DispatchQueue.main.async {
      if self.pendingPromise != nil {
        promise.reject(
          "DEPTH_READING_IN_PROGRESS",
          "A depth reading is already in progress."
        )
        return
      }

      guard ARWorldTrackingConfiguration.isSupported else {
        promise.reject(
          "AR_NOT_SUPPORTED",
          "AR world tracking is not supported on this device."
        )
        return
      }

      if #available(iOS 14.0, *) {
        let supportsSceneDepth =
          ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)

        let supportsSmoothedSceneDepth =
          ARWorldTrackingConfiguration.supportsFrameSemantics(.smoothedSceneDepth)

        guard supportsSceneDepth || supportsSmoothedSceneDepth else {
          promise.reject(
            "DEPTH_NOT_SUPPORTED",
            "This device does not support ARKit scene depth readings."
          )
          return
        }

        self.readingRequestId += 1
        self.pendingPromise = promise
        self.frameCountAfterRequest = 0

        if !self.sessionIsRunning {
          let configuration = ARWorldTrackingConfiguration()

          if supportsSmoothedSceneDepth {
            configuration.frameSemantics.insert(.smoothedSceneDepth)
          } else if supportsSceneDepth {
            configuration.frameSemantics.insert(.sceneDepth)
          }

          self.session.delegate = self
          self.session.run(
            configuration,
            options: [.resetTracking, .removeExistingAnchors]
          )

          self.sessionIsRunning = true
        }

        let timeout = DispatchWorkItem { [weak self] in
          guard let self = self else { return }

          if let pendingPromise = self.pendingPromise {
            pendingPromise.reject(
              "DEPTH_TIMEOUT",
              "No fresh depth reading was received. Try pointing the camera at a nearby non-reflective object with good lighting."
            )
          }

          self.cleanupReadingOnly()
        }

        self.timeoutWorkItem = timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0, execute: timeout)
      } else {
        promise.reject(
          "IOS_VERSION_NOT_SUPPORTED",
          "iOS 14 or newer is required for ARKit scene depth readings."
        )
      }
    }
  }

  func session(_ session: ARSession, didUpdate frame: ARFrame) {
    guard let pendingPromise = pendingPromise else {
      return
    }

    frameCountAfterRequest += 1

    // Wait for several fresh frames after each button tap.
    // This avoids returning the first stale/cached depth frame.
    guard frameCountAfterRequest >= 12 else {
      return
    }

    if #available(iOS 14.0, *) {
      let depthData = frame.smoothedSceneDepth ?? frame.sceneDepth

      guard let depthData = depthData else {
        return
      }

      let depthMap = depthData.depthMap
      let depthMeters = readCenterDepthMeters(from: depthMap)

      guard depthMeters > 0, depthMeters.isFinite else {
        return
      }

      let depthInches = depthMeters * 39.3701

      pendingPromise.resolve([
        "status": "success",
        "depthMeters": depthMeters,
        "depthInches": depthInches,
        "roundedInches": Int(depthInches.rounded()),
        "frameTimestamp": frame.timestamp,
        "frameCountAfterRequest": self.frameCountAfterRequest,
        "readingRequestId": self.readingRequestId,
        "message": "Fresh center depth reading received."
      ])

      cleanupReadingOnly()
    }
  }

  private func readCenterDepthMeters(from depthMap: CVPixelBuffer) -> Float {
    CVPixelBufferLockBaseAddress(depthMap, .readOnly)
    defer {
      CVPixelBufferUnlockBaseAddress(depthMap, .readOnly)
    }

    let width = CVPixelBufferGetWidth(depthMap)
    let height = CVPixelBufferGetHeight(depthMap)
    let centerX = width / 2
    let centerY = height / 2

    guard let baseAddress = CVPixelBufferGetBaseAddress(depthMap) else {
      return -1
    }

    let bytesPerRow = CVPixelBufferGetBytesPerRow(depthMap)

    var validDepths: [Float] = []

    // 15 x 15 center patch.
    // Median is more stable than one raw center pixel.
    let patchRadius = 7

    for yOffset in -patchRadius...patchRadius {
      for xOffset in -patchRadius...patchRadius {
        let sampleX = centerX + xOffset
        let sampleY = centerY + yOffset

        if sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height {
          continue
        }

        let rowPointer = baseAddress.advanced(by: sampleY * bytesPerRow)
        let floatPointer = rowPointer.assumingMemoryBound(to: Float32.self)
        let depth = floatPointer[sampleX]

        if depth.isFinite && depth > 0.05 && depth < 10.0 {
          validDepths.append(depth)
        }
      }
    }

    if validDepths.isEmpty {
      return -1
    }

    validDepths.sort()

    let middleIndex = validDepths.count / 2
    return validDepths[middleIndex]
  }

  private func cleanupReadingOnly() {
    timeoutWorkItem?.cancel()
    timeoutWorkItem = nil
    pendingPromise = nil
    frameCountAfterRequest = 0
  }
}

public class RvLidarModule: Module {
  private let depthReader = RvLidarDepthReader()

  public func definition() -> ModuleDefinition {
    Name("RvLidar")

    Function("checkAvailability") { () -> [String: Any] in
      let deviceName = UIDevice.current.model
      let systemVersion = UIDevice.current.systemVersion

      let worldTrackingSupported = ARWorldTrackingConfiguration.isSupported

      var sceneDepthSupported = false
      var smoothedSceneDepthSupported = false
      var sceneReconstructionSupported = false

      if worldTrackingSupported {
        if #available(iOS 13.4, *) {
          sceneDepthSupported =
            ARWorldTrackingConfiguration.supportsFrameSemantics(.sceneDepth)

          smoothedSceneDepthSupported =
            ARWorldTrackingConfiguration.supportsFrameSemantics(.smoothedSceneDepth)

          sceneReconstructionSupported =
            ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh)
        }
      }

      let lidarLikelySupported =
        worldTrackingSupported &&
        (sceneDepthSupported || smoothedSceneDepthSupported || sceneReconstructionSupported)

      let status = lidarLikelySupported ? "supported" : "not-supported"

      let message = lidarLikelySupported
        ? "This device supports ARKit depth features needed for Real LiDAR Assist."
        : "This device does not report ARKit LiDAR/depth support. Manual and Test LiDAR modes are still available."

      return [
        "status": status,
        "deviceName": deviceName,
        "systemVersion": systemVersion,
        "worldTrackingSupported": worldTrackingSupported,
        "sceneDepthSupported": sceneDepthSupported,
        "smoothedSceneDepthSupported": smoothedSceneDepthSupported,
        "sceneReconstructionSupported": sceneReconstructionSupported,
        "lidarLikelySupported": lidarLikelySupported,
        "message": message
      ]
    }

    AsyncFunction("getCenterDepthReading") { (promise: Promise) in
      self.depthReader.getCenterDepthReading(promise: promise)
    }
  }
}