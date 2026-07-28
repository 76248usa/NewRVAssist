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
  onChangeStopRecoveryConfirmed?: (value: boolean) => void;
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

type LidarSafetyStatusCardProps = {
  manualModeActive: boolean;
  nativeLidarAvailability: NativeLidarAvailabilityResult | null;
  liveRearDistanceActive: boolean;
  autoStopTriggered: boolean;
  liveRearDistanceNumber: number | null;
  liveRearDistanceLabel: string;
};

function LidarSafetyStatusCard({
  manualModeActive,
  nativeLidarAvailability,
  liveRearDistanceActive,
  autoStopTriggered,
  liveRearDistanceNumber,
  liveRearDistanceLabel,
}: LidarSafetyStatusCardProps) {
  const realLidarReady = nativeLidarAvailability?.status === "supported";

  const rearText =
    liveRearDistanceNumber === null
      ? "No rear reading yet"
      : `Rear ${Math.round(liveRearDistanceNumber)} in • ${liveRearDistanceLabel}`;

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 14,
        backgroundColor: autoStopTriggered
          ? "#fee2e2"
          : liveRearDistanceActive
            ? "#dcfce7"
            : "#f8fafc",
        borderWidth: 2,
        borderColor: autoStopTriggered
          ? "#dc2626"
          : liveRearDistanceActive
            ? "#22c55e"
            : "#cbd5e1",
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "900",
          color: autoStopTriggered ? "#991b1b" : "#0f172a",
          textAlign: "center",
        }}
      >
        LiDAR Safety Status
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: "800",
          color: autoStopTriggered ? "#991b1b" : "#475569",
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        {autoStopTriggered
          ? "AUTO STOP triggered. Get out and inspect before moving."
          : liveRearDistanceActive
            ? "Live rear distance is running. Move in inches, not feet."
            : "Confirm setup before starting live rear distance."}
      </Text>

      <View style={{ marginTop: 10, gap: 6 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: "#0f172a",
            lineHeight: 16,
          }}
        >
          Manual backup: {manualModeActive ? "Available" : "Not active"}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: realLidarReady ? "#166534" : "#92400e",
            lineHeight: 16,
          }}
        >
          Real rear LiDAR: {realLidarReady ? "Ready" : "Check readiness first"}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: liveRearDistanceActive ? "#166534" : "#475569",
            lineHeight: 16,
          }}
        >
          Live rear distance: {liveRearDistanceActive ? "Active" : "Stopped"}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: liveRearDistanceActive ? "#166534" : "#475569",
            lineHeight: 16,
          }}
        >
          Voice alerts:{" "}
          {liveRearDistanceActive ? "Active" : "Start with live mode"}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            color: autoStopTriggered ? "#991b1b" : "#475569",
            lineHeight: 16,
          }}
        >
          Auto Stop:{" "}
          {autoStopTriggered ? "Triggered" : "Armed during live mode"}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "900",
            color: autoStopTriggered ? "#991b1b" : "#0f172a",
            lineHeight: 16,
          }}
        >
          Current rear status: {rearText}
        </Text>
      </View>
    </View>
  );
}

function LidarFieldTestChecklist() {
  const [expanded, setExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const checklistItems = [
    {
      key: "parked",
      title: "Vehicle parked and secure",
      detail:
        "Test only while parked or moving very slowly in a controlled open area.",
    },
    {
      key: "spotter",
      title: "Spotter available",
      detail: "Have a second person outside watching the rear of the RV.",
    },
    {
      key: "camera",
      title: "iPhone aimed behind the RV",
      detail:
        "Point the rear camera toward the obstacle or open space behind the RV.",
    },
    {
      key: "reading",
      title: "Rear distance reading changes",
      detail: "Move closer and farther and confirm the rear inches change.",
    },
    {
      key: "caution",
      title: "CAUTION voice tested",
      detail:
        "Confirm the app gives a clear caution warning before STOP distance.",
    },
    {
      key: "stop",
      title: "STOP voice tested",
      detail:
        "Confirm the app clearly says STOP when rear clearance is too close.",
    },
    {
      key: "autostop",
      title: "AUTO STOP tested",
      detail:
        "Confirm repeated STOP readings stop Live Rear Distance automatically.",
    },
    {
      key: "recovery",
      title: "Recovery reset tested",
      detail:
        "Tap got-out-and-checked reset and confirm Live Rear Distance can restart.",
    },
  ];

  const completedCount = checklistItems.filter(
    (item) => checkedItems[item.key],
  ).length;

  const toggleItem = (key: string) => {
    setCheckedItems((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <View
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#f8fafc",
        borderWidth: 2,
        borderColor:
          completedCount === checklistItems.length ? "#22c55e" : "#cbd5e1",
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
              fontSize: 13,
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            LiDAR Field Test Checklist
          </Text>

          <Text
            style={{
              marginTop: 5,
              fontSize: 11,
              fontWeight: "800",
              color:
                completedCount === checklistItems.length
                  ? "#166534"
                  : "#475569",
              lineHeight: 16,
            }}
          >
            {completedCount} / {checklistItems.length} safety checks completed
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: 999,
            backgroundColor: expanded ? "#e0f2fe" : "#f1f5f9",
            borderWidth: 1,
            borderColor: expanded ? "#38bdf8" : "#cbd5e1",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color: expanded ? "#075985" : "#475569",
            }}
          >
            {expanded ? "Hide" : "Show"}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <>
          <View style={{ marginTop: 10, gap: 8 }}>
            {checklistItems.map((item) => {
              const checked = checkedItems[item.key] === true;

              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => toggleItem(item.key)}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: checked ? "#dcfce7" : "white",
                    borderWidth: 1,
                    borderColor: checked ? "#22c55e" : "#e2e8f0",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: checked ? "#166534" : "#0f172a",
                      lineHeight: 16,
                    }}
                  >
                    {checked ? "✓ " : "○ "}
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      fontWeight: "700",
                      color: checked ? "#166534" : "#475569",
                      lineHeight: 15,
                    }}
                  >
                    {item.detail}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setCheckedItems({})}
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#f1f5f9",
              borderWidth: 1,
              borderColor: "#cbd5e1",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#475569",
                textAlign: "center",
              }}
            >
              Reset Checklist
            </Text>
          </TouchableOpacity>

          {completedCount === checklistItems.length ? (
            <Text
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: "900",
                color: "#166534",
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              Field test checklist complete. Continue using visual confirmation
              and a spotter.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export function LidarReadinessCard({
  manualModeActive = true,
  distanceSource,
  clearanceValues,
  stopRecoveryConfirmed,
  onChangeStopRecoveryConfirmed,
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
  const autoStopCountRef = useRef(0);
  const [autoStopCount, setAutoStopCount] = useState(0);
  const [autoStopTriggered, setAutoStopTriggered] = useState(false);

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
    if (!stopRecoveryConfirmed) {
      return;
    }

    autoStopCountRef.current = 0;
    setAutoStopCount(0);
    setAutoStopTriggered(false);

    setPreviousRearInches(null);
    setRearDistanceTrend("unknown");

    setBridgeMessage(
      "Recovery check confirmed. Auto Stop has been reset and live rear distance can be started again.",
    );
  }, [stopRecoveryConfirmed]);

  useEffect(() => {
    liveVoiceEnabledRef.current = liveVoiceEnabled;
  }, [liveVoiceEnabled]);

  const distanceSourceLabel = getDistanceSourceLabel(distanceSource);
  const bridgeStatusLabel = getBridgeStatusLabel(bridgeStatus);
  const parkingModeActive =
    liveRearDistanceActive || distanceSource === "real-lidar";

  const parkingModeTitle = autoStopTriggered
    ? "AUTO STOPPED"
    : parkingModeActive
      ? "PARKING MODE ACTIVE"
      : "PARKING MODE READY";

  const parkingModeMessage = autoStopTriggered
    ? "Do not continue backing. Get out and check behind the RV."
    : parkingModeActive
      ? "Watch rear distance, trend, and Auto Stop."
      : "Check LiDAR readiness, then start Live Rear Distance.";
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

  const rearCollisionCoachLevel =
    liveRearDistanceLevel === "stop"
      ? "stop"
      : liveRearDistanceLevel === "caution" && rearDistanceTrend === "closer"
        ? "caution"
        : rearDistanceTrend === "closer"
          ? "watch"
          : rearDistanceTrend === "farther"
            ? "improving"
            : "steady";

  const autoStopActive =
    liveRearDistanceActive &&
    liveRearDistanceLevel === "stop" &&
    liveRearDistanceNumber !== null;

  const autoStopMessage =
    autoStopActive && liveRearDistanceNumber !== null
      ? `AUTO STOP: Rear clearance is ${Math.round(
          liveRearDistanceNumber,
        )} inches. Stop backing and inspect before moving.`
      : "AUTO STOP is armed while live rear distance is running.";

  const liveStatusStripLabel = autoStopTriggered
    ? "AUTO STOPPED"
    : liveRearDistanceActive
      ? "LIVE ACTIVE"
      : nativeLidarAvailability?.status === "supported"
        ? "READY"
        : "NOT READY";

  const liveStatusStripRearText =
    liveRearDistanceNumber === null
      ? "Rear --"
      : `Rear ${Math.round(liveRearDistanceNumber)} in`;

  const liveStatusStripLevelText =
    liveRearDistanceNumber === null ? "Waiting" : liveRearDistanceLabel;

  const liveStatusStripTrendText = autoStopTriggered
    ? "Check behind RV"
    : rearDistanceTrend === "closer"
      ? "Getting CLOSER"
      : rearDistanceTrend === "farther"
        ? "Moving FARTHER"
        : rearDistanceTrend === "steady"
          ? "Holding steady"
          : "Waiting";

  const liveStatusStripText = `${liveStatusStripLabel} • ${liveStatusStripRearText} • ${liveStatusStripLevelText} • ${liveStatusStripTrendText}`;

  const liveStatusStripBackgroundColor = autoStopTriggered
    ? "#fee2e2"
    : liveRearDistanceActive
      ? liveRearDistanceStyles.backgroundColor
      : "#f1f5f9";

  const liveStatusStripBorderColor = autoStopTriggered
    ? "#dc2626"
    : liveRearDistanceActive
      ? liveRearDistanceStyles.borderColor
      : "#cbd5e1";

  const liveStatusStripTextColor = autoStopTriggered
    ? "#991b1b"
    : liveRearDistanceActive
      ? liveRearDistanceStyles.textColor
      : "#475569";

  const rearCollisionCoachMessage =
    rearCollisionCoachLevel === "stop"
      ? "STOP: Rear obstacle is too close. Do not continue backing."
      : rearCollisionCoachLevel === "caution"
        ? "CAUTION: You are still moving toward the obstacle. Move in inches, not feet."
        : rearCollisionCoachLevel === "watch"
          ? "Watch rear clearance. You are moving closer to the obstacle."
          : rearCollisionCoachLevel === "improving"
            ? "Recovery improving. Rear distance is increasing."
            : rearDistanceTrend === "steady"
              ? "Holding steady. Keep checking visually before moving."
              : "Waiting for enough readings to coach the next move.";

  const applyTestLidarReading = (
    label: string,
    reading: LidarClearanceReading,
  ) => {
    const bridgeResult = createTestLidarBridgeResult(reading);

    stopLiveRearDistance();
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

  const forceAutoStopLiveRearDistance = (rearInches: number) => {
    if (liveRearDistanceTimerRef.current) {
      clearInterval(liveRearDistanceTimerRef.current);
      liveRearDistanceTimerRef.current = null;
    }

    Speech.stop();
    Speech.speak(
      `Auto stop. Rear clearance is ${rearInches} inches. Stop backing and inspect before moving.`,
    );

    lastLiveVoiceLevelRef.current = null;
    lastLiveVoiceTimeRef.current = 0;

    liveReadingInProgressRef.current = false;
    liveRearDistanceActiveRef.current = false;
    setLiveRearDistanceActive(false);

    setAutoStopTriggered(true);
    setBridgeMessage(
      `AUTO STOP activated after repeated STOP readings. Rear clearance is ${rearInches} inches.`,
    );
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

        if (rearLevel === "stop") {
          const nextAutoStopCount = autoStopCountRef.current + 1;

          autoStopCountRef.current = nextAutoStopCount;
          setAutoStopCount(nextAutoStopCount);

          if (nextAutoStopCount >= 3) {
            forceAutoStopLiveRearDistance(rearDistanceNumber);
          }
        } else {
          autoStopCountRef.current = 0;
          setAutoStopCount(0);
          setAutoStopTriggered(false);
        }
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

    autoStopCountRef.current = 0;
    setAutoStopCount(0);
    setAutoStopTriggered(false);

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
    autoStopCountRef.current = 0;
    setAutoStopCount(0);
    setAutoStopTriggered(false);
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

      <View
        style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 12,
          backgroundColor: autoStopTriggered
            ? "#fee2e2"
            : parkingModeActive
              ? "#dcfce7"
              : "#f1f5f9",
          borderWidth: 2,
          borderColor: autoStopTriggered
            ? "#dc2626"
            : parkingModeActive
              ? "#22c55e"
              : "#cbd5e1",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: autoStopTriggered
              ? "#991b1b"
              : parkingModeActive
                ? "#166534"
                : "#475569",
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          {parkingModeTitle}
        </Text>

        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            fontWeight: "800",
            color: autoStopTriggered
              ? "#991b1b"
              : parkingModeActive
                ? "#166534"
                : "#475569",
            textAlign: "center",
            lineHeight: 15,
          }}
        >
          {parkingModeMessage}
        </Text>
      </View>
      {expanded ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: liveStatusStripBackgroundColor,
              borderWidth: 2,
              borderColor: liveStatusStripBorderColor,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: liveStatusStripTextColor,
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {liveStatusStripText}
            </Text>
          </View>
          <LidarSafetyStatusCard
            manualModeActive={manualModeActive}
            nativeLidarAvailability={nativeLidarAvailability}
            liveRearDistanceActive={liveRearDistanceActive}
            autoStopTriggered={autoStopTriggered}
            liveRearDistanceNumber={liveRearDistanceNumber}
            liveRearDistanceLabel={liveRearDistanceLabel}
          />{" "}
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: levelStyles.backgroundColor,
              borderWidth: 2,
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
              {`Current clearance status: ${currentWorstLevel.toUpperCase()}`}
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                fontWeight: "800",
                color: levelStyles.textColor,
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              {warningReason}
            </Text>
          </View>
          <LidarStatusRow
            label="Bridge status"
            value={bridgeStatusLabel}
            status={bridgeStatus === "not-connected" ? "planned" : "active"}
          />
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#475569",
                lineHeight: 16,
              }}
            >
              {bridgeMessage}
            </Text>
          </View>
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#f1f5f9",
              borderWidth: 1,
              borderColor: "#cbd5e1",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "900",
                color: "#0f172a",
              }}
            >
              Test LiDAR Readings
            </Text>

            <Text
              style={{
                marginTop: 5,
                fontSize: 11,
                fontWeight: "700",
                color: "#475569",
                lineHeight: 16,
              }}
            >
              Use these test readings to confirm SAFE, CAUTION, and STOP
              behavior before using real LiDAR.
            </Text>

            <View style={{ marginTop: 10, gap: 8 }}>
              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("Safe", {
                    left: 72,
                    right: 72,
                    rear: 72,
                    roof: 120,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#dcfce7",
                  borderWidth: 1,
                  borderColor: "#22c55e",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: "#166534",
                  }}
                >
                  Apply SAFE test reading
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("Caution", {
                    left: 48,
                    right: 48,
                    rear: 30,
                    roof: 120,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#fef3c7",
                  borderWidth: 1,
                  borderColor: "#f59e0b",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: "#92400e",
                  }}
                >
                  Apply CAUTION test reading
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  applyTestLidarReading("Stop", {
                    left: 48,
                    right: 48,
                    rear: 14,
                    roof: 120,
                    source: "test-lidar",
                    timestamp: Date.now(),
                  })
                }
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#fee2e2",
                  borderWidth: 1,
                  borderColor: "#ef4444",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: "#991b1b",
                  }}
                >
                  Apply STOP test reading
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearTestLidarReading}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    color: "#475569",
                  }}
                >
                  Clear LiDAR reading
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#eff6ff",
              borderWidth: 1,
              borderColor: "#bfdbfe",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "900",
                color: "#1e3a8a",
              }}
            >
              Real LiDAR Assist
            </Text>

            <Text
              style={{
                marginTop: 5,
                fontSize: 11,
                fontWeight: "800",
                color: "#1e40af",
                lineHeight: 16,
              }}
            >
              Spotter Mode only. Keep the iPhone aimed at the rear obstacle and
              visually confirm before backing.
            </Text>

            <TouchableOpacity
              onPress={handleCheckRealLidarReadiness}
              disabled={checkingRealLidar}
              style={{
                marginTop: 10,
                paddingVertical: 11,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: checkingRealLidar ? "#e2e8f0" : "#dbeafe",
                borderWidth: 1,
                borderColor: "#60a5fa",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  color: "#1e40af",
                  textAlign: "center",
                }}
              >
                {checkingRealLidar
                  ? "Checking Real LiDAR..."
                  : "Check Real LiDAR Readiness"}
              </Text>
            </TouchableOpacity>

            {realLidarPreflight ? (
              <View
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: realLidarPreflight.canContinueToNativeLidarCheck
                    ? "#22c55e"
                    : "#f59e0b",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#334155",
                    lineHeight: 16,
                  }}
                >
                  {realLidarPreflight.message}
                </Text>

                {!realLidarPreflight.canContinueToNativeLidarCheck ? (
                  <TouchableOpacity
                    onPress={handleRequestRealLidarCameraPermission}
                    disabled={checkingRealLidar}
                    style={{
                      marginTop: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: "#fef3c7",
                      borderWidth: 1,
                      borderColor: "#f59e0b",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "900",
                        color: "#92400e",
                        textAlign: "center",
                      }}
                    >
                      Request Camera Permission
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {nativeLidarAvailability ? (
              <View
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor:
                    nativeLidarAvailability.status === "supported"
                      ? "#22c55e"
                      : "#ef4444",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color:
                      nativeLidarAvailability.status === "supported"
                        ? "#166534"
                        : "#991b1b",
                    lineHeight: 16,
                  }}
                >
                  {nativeLidarAvailability.message}
                </Text>
              </View>
            ) : null}

            {nativeLidarAvailability?.status === "supported" ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                <TouchableOpacity
                  onPress={readRealLidarRearDistance}
                  disabled={checkingCenterDepth || liveRearDistanceActive}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor:
                      checkingCenterDepth || liveRearDistanceActive
                        ? "#e2e8f0"
                        : "#dcfce7",
                    borderWidth: 1,
                    borderColor: "#22c55e",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: "#166534",
                      textAlign: "center",
                    }}
                  >
                    {checkingCenterDepth
                      ? "Reading rear distance..."
                      : hasRealLidarRearReading
                        ? "Refresh Real LiDAR Rear Distance"
                        : "Use Real LiDAR Rear Distance"}
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#475569",
                    lineHeight: 16,
                    textAlign: "center",
                  }}
                >
                  Point the iPhone toward the obstacle behind the RV. Keep the
                  phone steady while reading.
                </Text>

                <TouchableOpacity
                  onPress={() => setLiveSafetyConfirmed((value) => !value)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: liveSafetyConfirmed
                      ? "#dcfce7"
                      : "#fef3c7",
                    borderWidth: 1,
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
                      ? "Spotter safety confirmed"
                      : "I understand: LiDAR is a spotter aid only"}
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={startLiveRearDistance}
                    disabled={liveRearDistanceActive || !liveSafetyConfirmed}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor:
                        liveRearDistanceActive || !liveSafetyConfirmed
                          ? "#e2e8f0"
                          : "#dcfce7",
                      borderWidth: 1,
                      borderColor: "#22c55e",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "900",
                        color:
                          liveRearDistanceActive || !liveSafetyConfirmed
                            ? "#64748b"
                            : "#166534",
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
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: liveRearDistanceActive
                        ? "#fee2e2"
                        : "#e2e8f0",
                      borderWidth: 1,
                      borderColor: liveRearDistanceActive
                        ? "#ef4444"
                        : "#cbd5e1",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "900",
                        color: liveRearDistanceActive ? "#991b1b" : "#64748b",
                        textAlign: "center",
                      }}
                    >
                      Stop Live Rear Distance
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: liveRearDistanceActive ? "#166534" : "#475569",
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  {liveRearDistanceActive
                    ? "Voice alerts are active while live rear distance is running. Move slowly and confirm visually before backing."
                    : "Voice alerts will start when live rear distance is running."}
                </Text>

                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: liveRearDistanceStyles.backgroundColor,
                    borderWidth: 3,
                    borderColor: liveRearDistanceStyles.borderColor,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: liveRearDistanceStyles.textColor,
                      textAlign: "center",
                    }}
                  >
                    LIVE REAR DISTANCE
                  </Text>

                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 24,
                      fontWeight: "900",
                      color: liveRearDistanceStyles.textColor,
                      textAlign: "center",
                    }}
                  >
                    {liveRearDistanceNumber === null
                      ? "-- in"
                      : `${Math.round(liveRearDistanceNumber)} in`}
                  </Text>

                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 13,
                      fontWeight: "900",
                      color: liveRearDistanceStyles.textColor,
                      textAlign: "center",
                    }}
                  >
                    {liveRearDistanceLabel}
                  </Text>
                </View>

                <View
                  style={{
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

                <View
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor:
                      rearCollisionCoachLevel === "stop"
                        ? "#fee2e2"
                        : rearCollisionCoachLevel === "caution"
                          ? "#fef3c7"
                          : rearCollisionCoachLevel === "improving"
                            ? "#dcfce7"
                            : "#f1f5f9",
                    borderWidth: 2,
                    borderColor:
                      rearCollisionCoachLevel === "stop"
                        ? "#ef4444"
                        : rearCollisionCoachLevel === "caution"
                          ? "#f59e0b"
                          : rearCollisionCoachLevel === "improving"
                            ? "#22c55e"
                            : "#cbd5e1",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color:
                        rearCollisionCoachLevel === "stop"
                          ? "#991b1b"
                          : rearCollisionCoachLevel === "caution"
                            ? "#92400e"
                            : rearCollisionCoachLevel === "improving"
                              ? "#166534"
                              : "#475569",
                      textAlign: "center",
                      lineHeight: 16,
                    }}
                  >
                    {rearCollisionCoachMessage}
                  </Text>
                </View>

                <View
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor:
                      autoStopActive || autoStopTriggered
                        ? "#fee2e2"
                        : "#f8fafc",
                    borderWidth: 3,
                    borderColor:
                      autoStopActive || autoStopTriggered
                        ? "#dc2626"
                        : "#cbd5e1",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "900",
                      color:
                        autoStopActive || autoStopTriggered
                          ? "#991b1b"
                          : "#475569",
                      textAlign: "center",
                      lineHeight: 17,
                    }}
                  >
                    {autoStopTriggered
                      ? "AUTO STOP triggered. Live rear distance has been stopped. Get out and check behind the RV."
                      : autoStopMessage}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      fontWeight: "800",
                      color: autoStopTriggered ? "#991b1b" : "#475569",
                      textAlign: "center",
                      lineHeight: 16,
                    }}
                  >
                    {autoStopTriggered
                      ? "Recovery check is required before continuing."
                      : `Repeated STOP counter: ${autoStopCount} / 3`}
                  </Text>

                  {autoStopActive ? (
                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: "800",
                        color: "#991b1b",
                        textAlign: "center",
                        lineHeight: 16,
                      }}
                    >
                      Do not continue backing. Get out and confirm the rear
                      clearance visually.
                    </Text>
                  ) : null}

                  {autoStopTriggered ? (
                    <TouchableOpacity
                      onPress={() => {
                        autoStopCountRef.current = 0;
                        setAutoStopCount(0);
                        setAutoStopTriggered(false);

                        setPreviousRearInches(null);
                        setRearDistanceTrend("unknown");

                        onChangeStopRecoveryConfirmed?.(true);

                        setBridgeMessage(
                          "Recovery check confirmed. Auto Stop has been reset and live rear distance can be started again.",
                        );
                      }}
                      style={{
                        marginTop: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: "#dcfce7",
                        borderWidth: 2,
                        borderColor: "#22c55e",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "900",
                          color: "#166534",
                          textAlign: "center",
                          lineHeight: 16,
                        }}
                      >
                        I got out and checked — reset Auto Stop
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <LidarFieldTestChecklist />

                {centerDepthReading ? (
                  <View
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: "white",
                      borderWidth: 1,
                      borderColor:
                        centerDepthReading.status === "success"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color:
                          centerDepthReading.status === "success"
                            ? "#166534"
                            : "#991b1b",
                        lineHeight: 16,
                        textAlign: "center",
                      }}
                    >
                      {centerDepthReading.message}
                    </Text>
                  </View>
                ) : null}

                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#64748b",
                    textAlign: "center",
                    lineHeight: 14,
                  }}
                >
                  {`Live refreshes: ${realLidarRefreshCount}${lastAppliedRearInches ? ` • Last rear: ${lastAppliedRearInches} in` : ""}`}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: manualModeActive ? "#475569" : "#94a3b8",
              textAlign: "center",
              lineHeight: 14,
            }}
          >
            Manual clearance entry remains available as the backup safety mode.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
