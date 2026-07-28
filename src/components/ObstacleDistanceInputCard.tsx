import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ParkingType } from "../constants/parkingGuidance";
import { ClearanceValues } from "../types/clearance";
import { DistanceSource } from "../types/lidar";
import {
  ClearanceItem,
  getClearanceLevel,
  getLevelStyles,
  getSpecificWarningReason,
  getVoiceWarning,
  parseDistance,
} from "../utils/clearanceWarnings";
import { DistanceWarningSummaryCard } from "./DistanceWarningSummaryCard";
import { SiteObstacle } from "./SiteObstacleSelector";
const AUTO_STOP_VOICE_ALERTS_KEY = "rv_auto_stop_voice_alerts_enabled";
type Props = {
  parkingType: ParkingType;
  obstacles: SiteObstacle[];
  clearanceValues: ClearanceValues;
  onChangeClearanceValues: (values: ClearanceValues) => void;
  distanceSource: DistanceSource;
  stopRecoveryConfirmed: boolean;
  onChangeStopRecoveryConfirmed: (value: boolean) => void;
};

export function ObstacleDistanceInputCard({
  parkingType,
  obstacles,
  clearanceValues,
  onChangeClearanceValues,
  distanceSource,
  stopRecoveryConfirmed,
  onChangeStopRecoveryConfirmed,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const lastAutoSpokenStopReasonRef = useRef<string | null>(null);

  const leftClearance = clearanceValues.left;
  const rightClearance = clearanceValues.right;
  const rearClearance = clearanceValues.rear;
  const roofClearance = clearanceValues.roof;

  const setLeftClearance = (value: string) => {
    onChangeClearanceValues({ ...clearanceValues, left: value });
  };

  const setRightClearance = (value: string) => {
    onChangeClearanceValues({ ...clearanceValues, right: value });
  };

  const setRearClearance = (value: string) => {
    onChangeClearanceValues({ ...clearanceValues, rear: value });
  };

  const setRoofClearance = (value: string) => {
    onChangeClearanceValues({ ...clearanceValues, roof: value });
  };
  const leftValue = parseDistance(leftClearance);
  const rightValue = parseDistance(rightClearance);
  const rearValue = parseDistance(rearClearance);
  const roofValue = parseDistance(roofClearance);

  const clearanceItems: ClearanceItem[] = [
    {
      key: "left",
      label: "Left side clearance",
      value: leftValue,
    },
    {
      key: "right",
      label: "Right side clearance",
      value: rightValue,
    },
    {
      key: "rear",
      label: "Rear clearance",
      value: rearValue,
    },
    {
      key: "roof",
      label: "Roof / branch clearance",
      value: roofValue,
    },
  ];

  const clearanceLevels = clearanceItems.map((item) =>
    getClearanceLevel(item.value),
  );

  const hasStopClearance = clearanceLevels.includes("stop");

  const [autoVoiceAlertsEnabled, setAutoVoiceAlertsEnabled] = useState(true);
  useEffect(() => {
    let isMounted = true;

    async function loadAutoVoiceSetting() {
      try {
        const savedValue = await AsyncStorage.getItem(
          AUTO_STOP_VOICE_ALERTS_KEY,
        );

        if (!isMounted || savedValue === null) return;

        setAutoVoiceAlertsEnabled(savedValue === "true");
      } catch {
        // Keep default setting if loading fails.
      }
    }

    loadAutoVoiceSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const levels = clearanceItems.map((item) => getClearanceLevel(item.value));
    const hasStopLevel = levels.includes("stop");

    if (!hasStopLevel) {
      lastAutoSpokenStopReasonRef.current = null;
      return;
    }

    if (!autoVoiceAlertsEnabled) {
      return;
    }

    const warningReason = getSpecificWarningReason(clearanceItems);
    const voiceWarning = getVoiceWarning("stop", warningReason);

    if (lastAutoSpokenStopReasonRef.current === voiceWarning) {
      return;
    }

    lastAutoSpokenStopReasonRef.current = voiceWarning;

    const timeoutId = setTimeout(() => {
      Speech.stop();

      setTimeout(() => {
        Speech.speak(voiceWarning, {
          language: "en-US",
          rate: 0.9,
          pitch: 1.0,
        });
      }, 150);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [leftValue, rightValue, rearValue, roofValue, autoVoiceAlertsEnabled]);
  const obstacleText =
    obstacles.length === 0
      ? "No selected obstacles"
      : obstacles
          .map((item) => {
            if (item === "treeLeft") return "Tree left";
            if (item === "poleRight") return "Pole right";
            if (item === "lowBranch") return "Low branch";
            return "Tight hookup side";
          })
          .join(" • ");

  return (
    <View
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#cbd5e1",
      }}
    >
      {/* <TouchableOpacity
        onPress={() => setExpanded((current) => !current)}
        activeOpacity={0.85}
      >
        <View
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
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Manual Distance Backup
            </Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: "700",
                color: "#475569",
                lineHeight: 17,
              }}
            >
              Manual clearance check now. Later this can use LiDAR readings.
            </Text>
          </View>

          <Text
            style={{
              fontSize: 13,
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            {expanded ? "Hide" : "Show"}
          </Text>
        </View>
      </TouchableOpacity> */}

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
            Manual Distance Backup
          </Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 11,
              fontWeight: "800",
              color: "#475569",
              lineHeight: 16,
            }}
          >
            Use if LiDAR is unavailable or a spotter measured the clearance.
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
          {expanded || (hasStopClearance && !stopRecoveryConfirmed) ? (
            <>
              <DistanceWarningSummaryCard
                clearanceItems={clearanceItems}
                distanceSource={distanceSource}
                stopRecoveryConfirmed={stopRecoveryConfirmed}
                onChangeStopRecoveryConfirmed={onChangeStopRecoveryConfirmed}
              />
              <TouchableOpacity
                onPress={async () => {
                  setAutoVoiceAlertsEnabled((current) => {
                    const nextValue = !current;

                    AsyncStorage.setItem(
                      AUTO_STOP_VOICE_ALERTS_KEY,
                      String(nextValue),
                    ).catch(() => {
                      // Ignore storage errors and keep the UI responsive.
                    });

                    return nextValue;
                  });

                  Speech.stop();
                }}
                activeOpacity={0.85}
                style={{
                  marginTop: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: autoVoiceAlertsEnabled
                    ? "#0f172a"
                    : "#64748b",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  {autoVoiceAlertsEnabled
                    ? "Auto STOP Voice Alerts: On"
                    : "Auto STOP Voice Alerts: Off"}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: "900",
                  color: "#334155",
                }}
              >
                Selected setup
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#475569",
                  lineHeight: 17,
                }}
              >
                {parkingType === "pull-through" ? "Pull-through" : "Back-in"}
                {obstacleText}
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                <DistanceInputRow
                  label="Left side clearance"
                  value={leftClearance}
                  onChangeText={setLeftClearance}
                />

                <DistanceInputRow
                  label="Right side clearance"
                  value={rightClearance}
                  onChangeText={setRightClearance}
                />

                <DistanceInputRow
                  label="Rear clearance"
                  value={rearClearance}
                  onChangeText={setRearClearance}
                />

                <DistanceInputRow
                  label="Roof / branch clearance"
                  value={roofClearance}
                  onChangeText={setRoofClearance}
                />
              </View>
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#64748b",
                  lineHeight: 16,
                  textAlign: "center",
                }}
              >
                Enter distances in inches. 36 inches or less = caution. 18
                inches or less = stop and get out to look.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onChangeClearanceValues({
                    left: "",
                    right: "",
                    rear: "",
                    roof: "",
                  });
                }}
                activeOpacity={0.85}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#e2e8f0",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#0f172a",
                  }}
                >
                  Reset distances
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

type DistanceInputRowProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
};

function DistanceInputRow({
  label,
  value,
  onChangeText,
}: DistanceInputRowProps) {
  const parsedValue = parseDistance(value);
  const level = getClearanceLevel(parsedValue);
  const levelStyles = getLevelStyles(level);

  return (
    <View
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            {label}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: "700",
              color: levelStyles.textColor,
            }}
          >
            {value.trim() ? levelStyles.label : "Not checked"}
          </Text>
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          blurOnSubmit={true}
          style={{
            width: 90,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 10,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: levelStyles.borderColor,
            fontSize: 14,
            fontWeight: "900",
            color: "#0f172a",
            textAlign: "center",
          }}
        />
      </View>
    </View>
  );
}
