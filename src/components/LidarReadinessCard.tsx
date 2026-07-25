import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ClearanceValues } from "../types/clearance";
import { DistanceSource, LidarClearanceReading } from "../types/lidar";
import {
  ClearanceItem,
  getClearanceLevel,
  getLevelStyles,
  getSpecificWarningReason,
  parseDistance,
} from "../utils/clearanceWarnings";
import {
  createManualModeBridgeResult,
  createTestLidarBridgeResult,
} from "../utils/lidarSensorBridge";
import {
  checkNativeLidarAvailability,
  getNativeCenterDepthReading,
  NativeCenterDepthReadingResult,
  NativeLidarAvailabilityResult,
} from "../utils/nativeLidarAvailability";
import {
  checkRealLidarPreflight,
  RealLidarPreflightResult,
  requestRealLidarCameraPermission,
} from "../utils/realLidarPreflight";

type Props = {
  manualModeActive?: boolean;
  distanceSource: DistanceSource;
  clearanceValues: ClearanceValues;
  stopRecoveryConfirmed: boolean;
  onApplyTestReading?: (values: ClearanceValues) => void;
  onApplyRealLidarReading?: (values: ClearanceValues) => void;
  onClearTestReading?: () => void;
};

type BridgeStatus =
  | "manual-mode"
  | "test-mode"
  | "real-lidar-ready"
  | "reading"
  | "not-connected";

type ChecklistStatus = "done" | "current" | "future";

type ChecklistRowProps = {
  status: ChecklistStatus;
  title: string;
  detail: string;
};

function getDistanceSourceLabel(distanceSource: DistanceSource) {
  if (distanceSource === "real-lidar") return "Real LiDAR Reading";
  if (distanceSource === "test-lidar") return "Test LiDAR Reading";
  return "Manual Entry";
}

function getBridgeStatusLabel(status: BridgeStatus) {
  if (status === "manual-mode") return "Manual Mode";
  if (status === "test-mode") return "Test LiDAR";
  if (status === "real-lidar-ready") return "Real LiDAR Ready";
  if (status === "reading") return "Reading";
  return "Not Connected";
}

function ChecklistRow({ status, title, detail }: ChecklistRowProps) {
  const statusText =
    status === "done" ? "Done" : status === "current" ? "Active" : "Future";

  const colors =
    status === "done"
      ? {
          backgroundColor: "#dcfce7",
          borderColor: "#22c55e",
          textColor: "#166534",
        }
      : status === "current"
        ? {
            backgroundColor: "#e0f2fe",
            borderColor: "#38bdf8",
            textColor: "#075985",
          }
        : {
            backgroundColor: "#f1f5f9",
            borderColor: "#cbd5e1",
            textColor: "#475569",
          };

  return (
    <View
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: colors.backgroundColor,
        borderWidth: 1,
        borderColor: colors.borderColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            paddingVertical: 3,
            paddingHorizontal: 7,
            borderRadius: 999,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: colors.borderColor,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color: colors.textColor,
            }}
          >
            {statusText}
          </Text>
        </View>

        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "900",
            color: colors.textColor,
          }}
        >
          {title}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 5,
          fontSize: 11,
          fontWeight: "700",
          color: colors.textColor,
          lineHeight: 16,
        }}
      >
        {detail}
      </Text>
    </View>
  );
}

type LidarStatusRowProps = {
  label: string;
  value: string;
  status: "manual" | "planned" | "active";
};

function LidarStatusRow({ label, value, status }: LidarStatusRowProps) {
  const colors =
    status === "active"
      ? {
          backgroundColor: "#dcfce7",
          borderColor: "#22c55e",
          chipColor: "#dcfce7",
          textColor: "#166534",
        }
      : status === "manual"
        ? {
            backgroundColor: "white",
            borderColor: "#bae6fd",
            chipColor: "#e0f2fe",
            textColor: "#075985",
          }
        : {
            backgroundColor: "white",
            borderColor: "#e2e8f0",
            chipColor: "#f1f5f9",
            textColor: "#475569",
          };

  return (
    <View
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: colors.backgroundColor,
        borderWidth: 1,
        borderColor: colors.borderColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 12,
            fontWeight: "900",
            color: "#0f172a",
          }}
        >
          {label}
        </Text>

        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: colors.chipColor,
            borderWidth: 1,
            borderColor: colors.borderColor,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "900",
              color: colors.textColor,
            }}
          >
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}
export function LidarReadinessCard({
  manualModeActive = true,
  distanceSource,
  clearanceValues,
  stopRecoveryConfirmed,
  onApplyTestReading,
  onApplyRealLidarReading,
  onClearTestReading,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("manual-mode");
  const [bridgeMessage, setBridgeMessage] = useState(
    createManualModeBridgeResult().message,
  );
  const [realLidarPreflight, setRealLidarPreflight] =
    useState<RealLidarPreflightResult | null>(null);
  const [checkingRealLidar, setCheckingRealLidar] = useState(false);
  const [nativeLidarAvailability, setNativeLidarAvailability] =
    useState<NativeLidarAvailabilityResult | null>(null);
  const [centerDepthReading, setCenterDepthReading] =
    useState<NativeCenterDepthReadingResult | null>(null);
  const [checkingCenterDepth, setCheckingCenterDepth] = useState(false);
  const [hasRealLidarRearReading, setHasRealLidarRearReading] = useState(false);
  const [liveRearDistanceActive, setLiveRearDistanceActive] = useState(false);
  const [liveVoiceEnabled, setLiveVoiceEnabled] = useState(true);
  const liveRearDistanceActiveRef = useRef(false);
  const liveVoiceEnabledRef = useRef(true);
  const [liveSafetyConfirmed, setLiveSafetyConfirmed] = useState(false);
  const [realLidarRefreshCount, setRealLidarRefreshCount] = useState(0);
  const [lastAppliedRearInches, setLastAppliedRearInches] = useState<
    string | null
  >(null);
  const [previousRearInches, setPreviousRearInches] = useState<number | null>(
    null,
  );
  const [rearDistanceTrend, setRearDistanceTrend] = useState<
    "closer" | "farther" | "steady" | "unknown"
  >("unknown");

  const liveRearDistanceTimerRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  const liveReadingInProgressRef = useRef(false);
  const lastLiveVoiceLevelRef = useRef<"safe" | "caution" | "stop" | null>(
    null,
  );
  const lastLiveVoiceTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (liveRearDistanceTimerRef.current) {
        clearInterval(liveRearDistanceTimerRef.current);
        liveRearDistanceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    liveRearDistanceActiveRef.current = liveRearDistanceActive;
  }, [liveRearDistanceActive]);

  useEffect(() => {
    liveVoiceEnabledRef.current = liveVoiceEnabled;
  }, [liveVoiceEnabled]);

  const distanceSourceLabel = getDistanceSourceLabel(distanceSource);
  const bridgeStatusLabel = getBridgeStatusLabel(bridgeStatus);

  const clearanceItems: ClearanceItem[] = [
    {
      key: "left",
      label: "Left side",
      value: parseDistance(clearanceValues.left),
    },
    {
      key: "right",
      label: "Right side",
      value: parseDistance(clearanceValues.right),
    },
    {
      key: "rear",
      label: "Rear",
      value: parseDistance(clearanceValues.rear),
    },
    {
      key: "roof",
      label: "Roof / branch",
      value: parseDistance(clearanceValues.roof),
    },
  ];

  const checkedClearanceItems = clearanceItems.filter(
    (item) => item.value !== null,
  );

  const currentWorstLevel = checkedClearanceItems.reduce(
    (worst, item) => {
      const level = getClearanceLevel(item.value);

      if (level === "stop") return "stop";
      if (level === "caution" && worst === "safe") return "caution";

      return worst;
    },
    "safe" as "safe" | "caution" | "stop",
  );

  const levelStyles = getLevelStyles(currentWorstLevel);
  const warningReason = getSpecificWarningReason(clearanceItems);

  const liveRearDistanceNumber = parseDistance(clearanceValues.rear);
  const liveRearDistanceLevel = getClearanceLevel(liveRearDistanceNumber);
  const liveRearDistanceStyles = getLevelStyles(liveRearDistanceLevel);

  const liveRearDistanceLabel =
    liveRearDistanceLevel === "stop"
      ? "STOP"
      : liveRearDistanceLevel === "caution"
        ? "CAUTION"
        : "SAFE";

  const applyTestLidarReading = (
    label: string,
    reading: LidarClearanceReading,
  ) => {
    const bridgeResult = createTestLidarBridgeResult(reading);

    setBridgeStatus("test-mode");
    setBridgeMessage(`${label} test LiDAR reading applied.`);
    setCenterDepthReading(null);
    setHasRealLidarRearReading(false);

    if (bridgeResult.clearanceValues) {
      onApplyTestReading?.(bridgeResult.clearanceValues);
    }
  };

  const speakLiveRearDistanceWarning = (
    rearInches: number,
    level: "safe" | "caution" | "stop",
  ) => {
    const now = Date.now();

    const sameLevelRecently =
      lastLiveVoiceLevelRef.current === level &&
      now - lastLiveVoiceTimeRef.current < 6000;

    if (sameLevelRecently) {
      return;
    }

    lastLiveVoiceLevelRef.current = level;
    lastLiveVoiceTimeRef.current = now;

    if (level === "stop") {
      Speech.stop();
      Speech.speak(
        `Stop. Rear clearance is ${rearInches} inches. Get out and inspect before moving.`,
      );
      return;
    }

    if (level === "caution") {
      Speech.stop();
      Speech.speak(
        `Caution. Rear clearance is ${rearInches} inches. Move in inches, not feet.`,
      );
    }
  };

  const readRealLidarRearDistance = async () => {
    try {
      setCheckingCenterDepth(true);

      const result = await getNativeCenterDepthReading();

      setCenterDepthReading(result);

      if (result.status !== "success") {
        setBridgeStatus("not-connected");
        setBridgeMessage(result.message);
        return;
      }

      if (result.roundedInches === null) {
        setBridgeStatus("not-connected");
        setBridgeMessage(
          "Real LiDAR returned a successful result, but no rounded distance was received.",
        );
        return;
      }

      const rearInches = String(result.roundedInches);

      const realLidarClearanceValues: ClearanceValues = {
        left: "",
        right: "",
        rear: rearInches,
        roof: "",
      };

      const rearDistanceNumber = result.roundedInches;
      const rearLevel = getClearanceLevel(rearDistanceNumber);

      if (previousRearInches === null) {
        setRearDistanceTrend("unknown");
      } else {
        const difference = rearDistanceNumber - previousRearInches;

        if (difference <= -2) {
          setRearDistanceTrend("closer");
        } else if (difference >= 2) {
          setRearDistanceTrend("farther");
        } else {
          setRearDistanceTrend("steady");
        }
      }

      setPreviousRearInches(rearDistanceNumber);

      if (liveRearDistanceActiveRef.current) {
        speakLiveRearDistanceWarning(rearDistanceNumber, rearLevel);
      }

      setLastAppliedRearInches(rearInches);
      setRealLidarRefreshCount((count) => count + 1);

      onApplyRealLidarReading?.({
        left: realLidarClearanceValues.left,
        right: realLidarClearanceValues.right,
        rear: realLidarClearanceValues.rear,
        roof: realLidarClearanceValues.roof,
      });

      setHasRealLidarRearReading(true);
      setBridgeStatus("reading");
      setBridgeMessage(
        `Rear clearance refreshed from Real LiDAR: ${rearInches} inches.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Real center depth reading failed before a native result was returned.";

      setCenterDepthReading({
        status: "error",
        depthMeters: null,
        depthInches: null,
        roundedInches: null,
        message,
      });

      setBridgeStatus("not-connected");
      setBridgeMessage(message);
    } finally {
      setCheckingCenterDepth(false);
    }
  };

  const startLiveRearDistance = () => {
    if (liveRearDistanceTimerRef.current) {
      return;
    }

    lastLiveVoiceLevelRef.current = null;
    lastLiveVoiceTimeRef.current = 0;
    liveRearDistanceActiveRef.current = true;
    setLiveRearDistanceActive(true);

    liveRearDistanceTimerRef.current = setInterval(async () => {
      if (liveReadingInProgressRef.current) {
        return;
      }

      try {
        liveReadingInProgressRef.current = true;
        await readRealLidarRearDistance();
      } finally {
        liveReadingInProgressRef.current = false;
      }
    }, 500);
  };

  const stopLiveRearDistance = () => {
    if (liveRearDistanceTimerRef.current) {
      clearInterval(liveRearDistanceTimerRef.current);
      liveRearDistanceTimerRef.current = null;
    }

    Speech.stop();
    lastLiveVoiceLevelRef.current = null;
    lastLiveVoiceTimeRef.current = 0;

    liveReadingInProgressRef.current = false;
    liveRearDistanceActiveRef.current = false;
    setLiveRearDistanceActive(false);

    setPreviousRearInches(null);
    setRearDistanceTrend("unknown");
  };

  const clearTestLidarReading = () => {
    stopLiveRearDistance();
    setBridgeStatus("manual-mode");
    setBridgeMessage(createManualModeBridgeResult().message);
    setRealLidarPreflight(null);
    setNativeLidarAvailability(null);
    setCenterDepthReading(null);
    setHasRealLidarRearReading(false);
    onClearTestReading?.();
  };

  const handleCheckRealLidarReadiness = async () => {
    try {
      setCheckingRealLidar(true);
      setCenterDepthReading(null);
      setHasRealLidarRearReading(false);

      const preflight = await checkRealLidarPreflight();
      setRealLidarPreflight(preflight);

      if (!preflight.canContinueToNativeLidarCheck) {
        setNativeLidarAvailability(null);
        setBridgeStatus("not-connected");
        setBridgeMessage(preflight.message);
        return;
      }

      const nativeResult = await checkNativeLidarAvailability();
      setNativeLidarAvailability(nativeResult);

      if (nativeResult.status === "supported") {
        setBridgeStatus("real-lidar-ready");
        setBridgeMessage(nativeResult.message);
      } else {
        setBridgeStatus("not-connected");
        setBridgeMessage(nativeResult.message);
      }
    } catch {
      setNativeLidarAvailability(null);
      setBridgeStatus("not-connected");
      setBridgeMessage(
        "Real LiDAR readiness check failed. Manual and Test LiDAR modes are still available.",
      );
    } finally {
      setCheckingRealLidar(false);
    }
  };

  const handleRequestRealLidarCameraPermission = async () => {
    try {
      setCheckingRealLidar(true);
      setCenterDepthReading(null);
      setHasRealLidarRearReading(false);

      const preflight = await requestRealLidarCameraPermission();
      setRealLidarPreflight(preflight);

      if (!preflight.canContinueToNativeLidarCheck) {
        setNativeLidarAvailability(null);
        setBridgeStatus("not-connected");
        setBridgeMessage(preflight.message);
        return;
      }

      const nativeResult = await checkNativeLidarAvailability();
      setNativeLidarAvailability(nativeResult);

      if (nativeResult.status === "supported") {
        setBridgeStatus("real-lidar-ready");
        setBridgeMessage(nativeResult.message);
      } else {
        setBridgeStatus("not-connected");
        setBridgeMessage(nativeResult.message);
      }
    } catch {
      setBridgeStatus("not-connected");
      setBridgeMessage(
        "Camera permission check failed. Manual and Test LiDAR modes are still available.",
      );
    } finally {
      setCheckingRealLidar(false);
    }
  };

  return (
    <View
      style={{
        marginTop: 14,
        padding: 12,
        borderRadius: 16,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#cbd5e1",
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((value) => !value)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            LiDAR Distance Assist
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: "800",
              color: "#475569",
              lineHeight: 16,
            }}
          >
            {`Source: ${distanceSourceLabel}`}
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 999,
            backgroundColor:
              distanceSource === "real-lidar"
                ? "#dcfce7"
                : distanceSource === "test-lidar"
                  ? "#e0f2fe"
                  : "#f1f5f9",
            borderWidth: 1,
            borderColor:
              distanceSource === "real-lidar"
                ? "#22c55e"
                : distanceSource === "test-lidar"
                  ? "#38bdf8"
                  : "#cbd5e1",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color:
                distanceSource === "real-lidar"
                  ? "#166534"
                  : distanceSource === "test-lidar"
                    ? "#075985"
                    : "#475569",
            }}
          >
            {expanded ? "Hide" : "Show"}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <ChecklistRow
            status="done"
            title="Manual clearance safety"
            detail="Manual distances can trigger SAFE, CAUTION, and STOP warnings."
          />

          <ChecklistRow
            status="done"
            title="Test LiDAR safety"
            detail="Test readings can simulate SAFE, CAUTION, and STOP distance conditions."
          />

          <ChecklistRow
            status="current"
            title="Real LiDAR rear clearance"
            detail="The iPhone can now read a real center depth and use it as rear clearance."
          />

          <ChecklistRow
            status="future"
            title="Live camera overlays"
            detail="Future versions can show real-time visual guide lines and obstacle zones."
          />

          <View style={{ gap: 8 }}>
            <LidarStatusRow
              label="Manual mode"
              value={manualModeActive ? "Available" : "Off"}
              status="manual"
            />

            <LidarStatusRow
              label="LiDAR Bridge"
              value={bridgeStatusLabel}
              status={bridgeStatus === "reading" ? "active" : "planned"}
            />

            <LidarStatusRow
              label="Distance Source"
              value={distanceSourceLabel}
              status={distanceSource === "real-lidar" ? "active" : "manual"}
            />
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: levelStyles.backgroundColor,
              borderWidth: 1,
              borderColor: levelStyles.borderColor,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: levelStyles.textColor,
                textAlign: "center",
              }}
            >
              {`Current Distance Status: ${currentWorstLevel.toUpperCase()}`}
            </Text>

            <Text
              style={{
                marginTop: 5,
                fontSize: 11,
                fontWeight: "800",
                color: levelStyles.textColor,
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {warningReason}
            </Text>

            <Text
              style={{
                marginTop: 5,
                fontSize: 11,
                fontWeight: "800",
                color: levelStyles.textColor,
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {bridgeMessage}
            </Text>

            {currentWorstLevel === "stop" ? (
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  fontWeight: "900",
                  color: stopRecoveryConfirmed ? "#166534" : "#991b1b",
                  textAlign: "center",
                  lineHeight: 16,
                }}
              >
                {`Recovery Status: ${
                  stopRecoveryConfirmed ? "Check Confirmed" : "Not Checked Yet"
                }`}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#eef2ff",
              borderWidth: 1,
              borderColor: "#c7d2fe",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#3730a3",
                textAlign: "center",
              }}
            >
              Test LiDAR Readings
            </Text>

            <View
              style={{
                marginTop: 9,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("SAFE", {
                    left: null,
                    right: null,
                    rear: 48,
                    roof: null,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: "#dcfce7",
                  borderWidth: 1,
                  borderColor: "#22c55e",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: "#166534",
                  }}
                >
                  Test SAFE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("CAUTION", {
                    left: null,
                    right: null,
                    rear: 28,
                    roof: null,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: "#fef3c7",
                  borderWidth: 1,
                  borderColor: "#f59e0b",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: "#92400e",
                  }}
                >
                  Test CAUTION
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("STOP", {
                    left: null,
                    right: null,
                    rear: 14,
                    roof: null,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: "#fee2e2",
                  borderWidth: 1,
                  borderColor: "#ef4444",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: "#991b1b",
                  }}
                >
                  Test STOP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearTestLidarReading}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color: "#334155",
                  }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#cbd5e1",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#334155",
                textAlign: "center",
              }}
            >
              Real LiDAR Assist
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: "800",
                color: "#475569",
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {
                "Check whether this device can use real iPhone LiDAR depth readings."
              }
            </Text>

            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#fef3c7",
                borderWidth: 1,
                borderColor: "#f59e0b",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  color: "#92400e",
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                LiDAR Spotter Mode
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#92400e",
                  lineHeight: 16,
                  textAlign: "center",
                }}
              >
                {
                  "Use this as a spotter or campsite pre-scan aid. Move slowly. Phone aim and LiDAR delay can affect readings. Always confirm visually before backing."
                }
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckRealLidarReadiness}
              disabled={checkingRealLidar}
              style={{
                marginTop: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: checkingRealLidar ? "#94a3b8" : "#0f172a",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                {checkingRealLidar
                  ? "Checking..."
                  : "Check Real LiDAR Readiness"}
              </Text>
            </TouchableOpacity>

            {realLidarPreflight?.status === "needs-camera-permission" ? (
              <TouchableOpacity
                onPress={handleRequestRealLidarCameraPermission}
                disabled={checkingRealLidar}
                style={{
                  marginTop: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#2563eb",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: "900",
                  }}
                >
                  Allow Camera for LiDAR Assist
                </Text>
              </TouchableOpacity>
            ) : null}

            {realLidarPreflight ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor:
                    realLidarPreflight.status === "ready-for-native-check"
                      ? "#dcfce7"
                      : realLidarPreflight.status === "camera-denied"
                        ? "#fee2e2"
                        : "#fff7ed",
                  borderWidth: 1,
                  borderColor:
                    realLidarPreflight.status === "ready-for-native-check"
                      ? "#86efac"
                      : realLidarPreflight.status === "camera-denied"
                        ? "#fecaca"
                        : "#fed7aa",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color:
                      realLidarPreflight.status === "ready-for-native-check"
                        ? "#166534"
                        : realLidarPreflight.status === "camera-denied"
                          ? "#991b1b"
                          : "#9a3412",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {realLidarPreflight.message}
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#475569",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {`Device: ${
                    realLidarPreflight.deviceName ?? "Unknown"
                  }\nCamera permission: ${realLidarPreflight.cameraPermission}`}
                </Text>
              </View>
            ) : null}

            {nativeLidarAvailability ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor:
                    nativeLidarAvailability.status === "supported"
                      ? "#dcfce7"
                      : nativeLidarAvailability.status ===
                          "native-module-missing"
                        ? "#fff7ed"
                        : "#fee2e2",
                  borderWidth: 1,
                  borderColor:
                    nativeLidarAvailability.status === "supported"
                      ? "#86efac"
                      : nativeLidarAvailability.status ===
                          "native-module-missing"
                        ? "#fed7aa"
                        : "#fecaca",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "900",
                    color:
                      nativeLidarAvailability.status === "supported"
                        ? "#166534"
                        : nativeLidarAvailability.status ===
                            "native-module-missing"
                          ? "#9a3412"
                          : "#991b1b",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {nativeLidarAvailability.message}
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#475569",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {`AR world tracking: ${
                    nativeLidarAvailability.worldTrackingSupported
                      ? "Yes"
                      : "No"
                  }\nScene depth: ${
                    nativeLidarAvailability.sceneDepthSupported ? "Yes" : "No"
                  }\nSmoothed scene depth: ${
                    nativeLidarAvailability.smoothedSceneDepthSupported
                      ? "Yes"
                      : "No"
                  }\nScene reconstruction: ${
                    nativeLidarAvailability.sceneReconstructionSupported
                      ? "Yes"
                      : "No"
                  }`}
                </Text>
              </View>
            ) : null}

            {nativeLidarAvailability?.status === "supported" ? (
              <>
                <TouchableOpacity
                  onPress={readRealLidarRearDistance}
                  disabled={checkingCenterDepth || liveRearDistanceActive}
                  style={{
                    marginTop: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor:
                      checkingCenterDepth || liveRearDistanceActive
                        ? "#94a3b8"
                        : "#16a34a",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 12,
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  >
                    {liveRearDistanceActive
                      ? "Live Rear Distance Running"
                      : checkingCenterDepth
                        ? "Reading Depth..."
                        : hasRealLidarRearReading
                          ? "Refresh Real LiDAR Rear Distance"
                          : "Use Real LiDAR as Rear Distance"}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#475569",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {
                    "Point the camera at the rear obstacle and tap refresh as you move slowly."
                  }
                </Text>

                <TouchableOpacity
                  onPress={() => setLiveSafetyConfirmed((value) => !value)}
                  style={{
                    marginTop: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: liveSafetyConfirmed
                      ? "#dcfce7"
                      : "#fff7ed",
                    borderWidth: 2,
                    borderColor: liveSafetyConfirmed ? "#22c55e" : "#f59e0b",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: liveSafetyConfirmed ? "#166534" : "#92400e",
                      textAlign: "center",
                      lineHeight: 16,
                    }}
                  >
                    {liveSafetyConfirmed
                      ? "Spotter Safety Confirmed"
                      : "Tap to confirm: Spotter Mode only — visually check before backing"}
                  </Text>
                </TouchableOpacity>
                <View
                  style={{
                    marginTop: 9,
                    flexDirection: "row",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={startLiveRearDistance}
                    disabled={liveRearDistanceActive || !liveSafetyConfirmed}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 12,

                      backgroundColor:
                        liveRearDistanceActive || !liveSafetyConfirmed
                          ? "#94a3b8"
                          : "#2563eb",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 11,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                    >
                      Start Live Rear Distance
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={stopLiveRearDistance}
                    disabled={!liveRearDistanceActive}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: liveRearDistanceActive
                        ? "#dc2626"
                        : "#94a3b8",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 11,
                        fontWeight: "900",
                        textAlign: "center",
                      }}
                    >
                      Stop Live Rear Distance
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    fontWeight: "800",
                    color: liveRearDistanceActive ? "#166534" : "#475569",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {liveRearDistanceActive
                    ? "Live rear distance is running. The app refreshes about twice per second."
                    : "Live mode is off. Use refresh manually or start live rear distance."}
                </Text>
                <View
                  style={{
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: liveRearDistanceActive
                      ? liveRearDistanceStyles.backgroundColor
                      : "#f1f5f9",
                    borderWidth: 2,
                    borderColor: liveRearDistanceActive
                      ? liveRearDistanceStyles.borderColor
                      : "#cbd5e1",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: liveRearDistanceActive
                        ? liveRearDistanceStyles.textColor
                        : "#475569",
                      marginBottom: 4,
                      letterSpacing: 0.5,
                    }}
                  >
                    {liveRearDistanceActive
                      ? "LIVE REAR DISTANCE"
                      : "LIVE REAR DISTANCE READY"}
                  </Text>

                  <Text
                    style={{
                      fontSize: 34,
                      fontWeight: "900",
                      color: liveRearDistanceActive
                        ? liveRearDistanceStyles.textColor
                        : "#475569",
                      marginBottom: 2,
                    }}
                  >
                    {liveRearDistanceNumber === null
                      ? "--"
                      : `${Math.round(liveRearDistanceNumber)} in`}
                  </Text>

                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: liveRearDistanceActive
                        ? liveRearDistanceStyles.textColor
                        : "#475569",
                    }}
                  >
                    {liveRearDistanceActive
                      ? liveRearDistanceLabel
                      : "NOT RUNNING"}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      fontWeight: "700",
                      color: liveRearDistanceActive
                        ? liveRearDistanceStyles.textColor
                        : "#475569",
                      textAlign: "center",
                      lineHeight: 16,
                    }}
                  >
                    {liveVoiceEnabled
                      ? "Voice alerts are on. Move slowly and confirm visually before backing."
                      : "Voice alerts are off. Watch the screen and confirm visually before backing."}
                  </Text>
                </View>

                <View
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor:
                      rearDistanceTrend === "closer"
                        ? "#fee2e2"
                        : rearDistanceTrend === "farther"
                          ? "#dcfce7"
                          : "#f1f5f9",
                    borderWidth: 1,
                    borderColor:
                      rearDistanceTrend === "closer"
                        ? "#ef4444"
                        : rearDistanceTrend === "farther"
                          ? "#22c55e"
                          : "#cbd5e1",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color:
                        rearDistanceTrend === "closer"
                          ? "#991b1b"
                          : rearDistanceTrend === "farther"
                            ? "#166534"
                            : "#475569",
                      textAlign: "center",
                    }}
                  >
                    {rearDistanceTrend === "closer"
                      ? "Trend: Getting CLOSER"
                      : rearDistanceTrend === "farther"
                        ? "Trend: Moving FARTHER away"
                        : rearDistanceTrend === "steady"
                          ? "Trend: Holding steady"
                          : "Trend: Waiting for second reading"}
                  </Text>
                </View>
                {centerDepthReading ? (
                  <View
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor:
                        centerDepthReading.status === "success"
                          ? "#dcfce7"
                          : "#fee2e2",
                      borderWidth: 1,
                      borderColor:
                        centerDepthReading.status === "success"
                          ? "#86efac"
                          : "#fecaca",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "900",
                        color:
                          centerDepthReading.status === "success"
                            ? "#166534"
                            : "#991b1b",
                        textAlign: "center",
                        lineHeight: 16,
                      }}
                    >
                      {centerDepthReading.message}
                    </Text>

                    {centerDepthReading.status === "success" ? (
                      <>
                        <Text
                          style={{
                            marginTop: 6,
                            fontSize: 18,
                            fontWeight: "900",
                            color: "#166534",
                            textAlign: "center",
                          }}
                        >
                          {`${centerDepthReading.roundedInches} inches`}
                        </Text>

                        <Text
                          style={{
                            marginTop: 5,
                            fontSize: 11,
                            fontWeight: "800",
                            color: "#166534",
                            textAlign: "center",
                            lineHeight: 16,
                          }}
                        >
                          {`Rear clearance updated from Real LiDAR.\nMeters: ${centerDepthReading.depthMeters?.toFixed(
                            2,
                          )}\nInches: ${centerDepthReading.depthInches?.toFixed(1)}`}
                        </Text>
                      </>
                    ) : null}
                  </View>
                ) : null}
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    fontWeight: "800",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  {`Live refreshes: ${realLidarRefreshCount}. Last rear: ${
                    lastAppliedRearInches ?? "--"
                  } in.`}
                </Text>
              </>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
