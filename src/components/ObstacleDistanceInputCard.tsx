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
  const [expanded, setExpanded] = useState(false);
  const [autoVoiceAlertsEnabled, setAutoVoiceAlertsEnabled] = useState(true);

  const lastAutoSpokenStopReasonRef = useRef<string | null>(null);

  const leftClearance = clearanceValues.left;
  const rightClearance = clearanceValues.right;
  const rearClearance = clearanceValues.rear;
  const roofClearance = clearanceValues.roof;

  const setLeftClearance = (value: string) => {
    onChangeClearanceValues({
      ...clearanceValues,
      left: value,
    });
  };

  const setRightClearance = (value: string) => {
    onChangeClearanceValues({
      ...clearanceValues,
      right: value,
    });
  };

  const setRearClearance = (value: string) => {
    onChangeClearanceValues({
      ...clearanceValues,
      rear: value,
    });
  };

  const setRoofClearance = (value: string) => {
    onChangeClearanceValues({
      ...clearanceValues,
      roof: value,
    });
  };

  const resetDistances = () => {
    onChangeClearanceValues({
      left: "",
      right: "",
      rear: "",
      roof: "",
    });

    onChangeStopRecoveryConfirmed(false);
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

  const hasLidarReading =
    distanceSource === "real-lidar" || distanceSource === "test-lidar";

  const shouldAutoOpenManualBackup =
    !hasLidarReading &&
    (distanceSource === "manual" ||
      (hasStopClearance && !stopRecoveryConfirmed));

  useEffect(() => {
    setExpanded(shouldAutoOpenManualBackup);
  }, [shouldAutoOpenManualBackup]);

  useEffect(() => {
    let isMounted = true;

    async function loadAutoVoiceSetting() {
      try {
        const savedValue = await AsyncStorage.getItem(
          AUTO_STOP_VOICE_ALERTS_KEY,
        );

        if (!isMounted || savedValue === null) {
          return;
        }

        setAutoVoiceAlertsEnabled(savedValue === "true");
      } catch {
        // Keep the default setting if loading fails.
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
          pitch: 1,
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
            if (item === "treeLeft") {
              return "Tree left";
            }

            if (item === "poleRight") {
              return "Pole right";
            }

            if (item === "lowBranch") {
              return "Low branch";
            }

            return "Tight hookup side";
          })
          .join(" • ");

  const setupLabel =
    parkingType === "pull-through" ? "Pull-through" : "Back-in";

  const emphasizeLeft =
    obstacles.includes("treeLeft") || obstacles.includes("tightHookupSide");

  const emphasizeRight =
    obstacles.includes("poleRight") || obstacles.includes("tightHookupSide");

  const emphasizeRoof = obstacles.includes("lowBranch");

  const leftHint = obstacles.includes("treeLeft")
    ? "Measure the RV side to the closest point of the tree."
    : obstacles.includes("tightHookupSide")
      ? "Measure the closest side clearance on the hookup side."
      : undefined;

  const rightHint = obstacles.includes("poleRight")
    ? "Measure the RV side to the closest point of the pole."
    : obstacles.includes("tightHookupSide")
      ? "Measure the closest side clearance on the hookup side."
      : undefined;

  const roofHint = obstacles.includes("lowBranch")
    ? "Measure from the highest roof feature to the lowest branch."
    : undefined;

  const toggleAutoVoiceAlerts = () => {
    setAutoVoiceAlertsEnabled((current) => {
      const nextValue = !current;

      AsyncStorage.setItem(AUTO_STOP_VOICE_ALERTS_KEY, String(nextValue)).catch(
        () => {
          // Keep the interface responsive if storage fails.
        },
      );

      return nextValue;
    });

    Speech.stop();
  };

  return (
    <View
      style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 14,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#dbe3ef",
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.85}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flex: 1,
            marginRight: 10,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            Manual Distance
          </Text>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontSize: 10,
              fontWeight: "500",
              color: "#64748b",
            }}
          >
            Backup measurements when LiDAR is unavailable
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 4,
            paddingHorizontal: 9,
            borderRadius: 999,
            backgroundColor: expanded ? "#e0f2fe" : "#f1f5f9",
            borderWidth: 1,
            borderColor: expanded ? "#7dd3fc" : "#dbe3ef",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: expanded ? "#075985" : "#64748b",
            }}
          >
            {expanded ? "Hide" : "Show"}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <>
          <DistanceWarningSummaryCard
            clearanceItems={clearanceItems}
            distanceSource={distanceSource}
            stopRecoveryConfirmed={stopRecoveryConfirmed}
            onChangeStopRecoveryConfirmed={onChangeStopRecoveryConfirmed}
            onResetDistances={resetDistances}
          />

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 7,
              paddingHorizontal: 9,
              borderRadius: 10,
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <View
              style={{
                flex: 1,
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: "#334155",
                }}
              >
                {setupLabel}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 2,
                  fontSize: 10,
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                {obstacleText}
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleAutoVoiceAlerts}
              activeOpacity={0.85}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 9,
                borderRadius: 9,
                backgroundColor: autoVoiceAlertsEnabled ? "#1e293b" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: autoVoiceAlertsEnabled ? "#ffffff" : "#475569",
                }}
              >
                Voice {autoVoiceAlertsEnabled ? "On" : "Off"}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
            }}
          >
            <View
              style={{
                flex: 1,
                marginRight: 4,
              }}
            >
              <DistanceInputTile
                label="Left"
                value={leftClearance}
                onChangeText={setLeftClearance}
                emphasized={emphasizeLeft}
                hint={leftHint}
              />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 4,
              }}
            >
              <DistanceInputTile
                label="Right"
                value={rightClearance}
                onChangeText={setRightClearance}
                emphasized={emphasizeRight}
                hint={rightHint}
              />
            </View>
          </View>

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
            }}
          >
            <View
              style={{
                flex: 1,
                marginRight: 4,
              }}
            >
              <DistanceInputTile
                label="Rear"
                value={rearClearance}
                onChangeText={setRearClearance}
              />
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 4,
              }}
            >
              <DistanceInputTile
                label="Roof"
                value={roofClearance}
                onChangeText={setRoofClearance}
                emphasized={emphasizeRoof}
                hint={roofHint}
              />
            </View>
          </View>

          <Text
            style={{
              marginTop: 8,
              fontSize: 9,
              fontWeight: "600",
              color: "#64748b",
              lineHeight: 13,
              textAlign: "center",
            }}
          >
            Inches • 36 or less: caution • 18 or less: stop and inspect
          </Text>
        </>
      ) : null}
    </View>
  );
}

type DistanceInputTileProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  emphasized?: boolean;
  hint?: string;
};

function DistanceInputTile({
  label,
  value,
  onChangeText,
  emphasized = false,
  hint,
}: DistanceInputTileProps) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const parsedValue = parseDistance(value);
  const level = getClearanceLevel(parsedValue);
  const levelStyles = getLevelStyles(level);

  const isStopLevel = level === "stop";
  const isCautionLevel = level === "caution";
  const hasValue = value.trim().length > 0;

  const commitDraftValue = () => {
    onChangeText(draftValue.trim());
  };

  const statusLabel = hasValue ? levelStyles.label : "Not checked";

  return (
    <View
      style={{
        padding: 8,
        borderRadius: 11,
        backgroundColor: "#ffffff",
        borderWidth: emphasized ? 2 : 1,
        borderColor:
          isStopLevel || isCautionLevel
            ? levelStyles.borderColor
            : emphasized
              ? "#0ea5e9"
              : "#e2e8f0",
      }}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            {label}
          </Text>

          {emphasized ? (
            <View
              style={{
                marginLeft: 5,
                minWidth: 44,
                paddingVertical: 2,
                paddingHorizontal: 7,
                borderRadius: 999,
                backgroundColor: "#e0f2fe",
                borderWidth: 1,
                borderColor: "#38bdf8",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text
                numberOfLines={1}
                allowFontScaling={false}
                style={{
                  fontSize: 8,
                  fontWeight: "900",
                  color: "#075985",
                  letterSpacing: 0.2,
                }}
              >
                CHECK
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={{
            marginTop: 3,
            fontSize: 9,
            fontWeight: isStopLevel ? "900" : "700",
            color: hasValue ? levelStyles.textColor : "#94a3b8",
          }}
        >
          {statusLabel}
        </Text>
      </View>
      <View
        style={{
          marginTop: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          value={draftValue}
          onChangeText={setDraftValue}
          onBlur={commitDraftValue}
          onSubmitEditing={commitDraftValue}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          blurOnSubmit={true}
          placeholder="—"
          placeholderTextColor="#94a3b8"
          style={{
            flex: 1,
            paddingVertical: 7,
            paddingHorizontal: 8,
            borderRadius: 9,
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: hasValue ? levelStyles.borderColor : "#cbd5e1",
            fontSize: 14,
            fontWeight: isStopLevel ? "900" : "700",
            color: "#0f172a",
            textAlign: "center",
          }}
        />

        <Text
          style={{
            marginLeft: 5,
            fontSize: 10,
            fontWeight: "700",
            color: "#64748b",
          }}
        >
          in
        </Text>
      </View>

      {emphasized && hint ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 9,
            fontWeight: "600",
            color: "#0369a1",
            lineHeight: 12,
          }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
