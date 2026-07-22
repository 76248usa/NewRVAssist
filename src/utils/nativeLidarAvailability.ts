import { requireNativeModule } from "expo-modules-core";

export type NativeLidarAvailabilityStatus =
  | "supported"
  | "not-supported"
  | "native-module-missing"
  | "error";

export type NativeLidarAvailabilityResult = {
  status: NativeLidarAvailabilityStatus;
  deviceName: string | null;
  systemVersion: string | null;
  worldTrackingSupported: boolean;
  sceneDepthSupported: boolean;
  smoothedSceneDepthSupported: boolean;
  sceneReconstructionSupported: boolean;
  lidarLikelySupported: boolean;
  message: string;
};

function fallbackResult(
  status: NativeLidarAvailabilityStatus,
  message: string,
): NativeLidarAvailabilityResult {
  return {
    status,
    deviceName: null,
    systemVersion: null,
    worldTrackingSupported: false,
    sceneDepthSupported: false,
    smoothedSceneDepthSupported: false,
    sceneReconstructionSupported: false,
    lidarLikelySupported: false,
    message,
  };
}

export async function checkNativeLidarAvailability(): Promise<NativeLidarAvailabilityResult> {
  try {
    const rvLidarModule = requireNativeModule("RvLidar") as {
      checkAvailability: () => NativeLidarAvailabilityResult;
    };

    return rvLidarModule.checkAvailability();
  } catch {
    return fallbackResult(
      "native-module-missing",
      "Native LiDAR availability module is not available in this build yet. Rebuild and reinstall the newest iPhone development build.",
    );
  }
}
export type NativeCenterDepthReadingResult = {
  status: "success" | "native-module-missing" | "error";
  depthMeters: number | null;
  depthInches: number | null;
  roundedInches: number | null;
  frameTimestamp?: number;
  frameCountAfterRequest?: number;
  message: string;
};

export async function getNativeCenterDepthReading(): Promise<NativeCenterDepthReadingResult> {
  try {
    const rvLidarModule = requireNativeModule("RvLidar") as {
      getCenterDepthReading?: () => Promise<NativeCenterDepthReadingResult>;
    };

    if (typeof rvLidarModule.getCenterDepthReading !== "function") {
      return {
        status: "native-module-missing",
        depthMeters: null,
        depthInches: null,
        roundedInches: null,
        message:
          "The installed iPhone build does not include getCenterDepthReading yet. Rebuild and reinstall the development build.",
      };
    }

    const result = await rvLidarModule.getCenterDepthReading();

    if (!result) {
      return {
        status: "error",
        depthMeters: null,
        depthInches: null,
        roundedInches: null,
        message:
          "The native LiDAR function returned no result. The installed build may still be old.",
      };
    }

    return result;
  } catch (error) {
    return {
      status: "error",
      depthMeters: null,
      depthInches: null,
      roundedInches: null,
      message:
        error instanceof Error
          ? error.message
          : "Real center depth reading failed with an unknown native error.",
    };
  }
}
