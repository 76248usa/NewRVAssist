import * as Speech from "expo-speech";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { DistanceSource } from "../types/lidar";
import {
  ClearanceItem,
  ClearanceLevel,
  getClearanceLevel,
  getLevelStyles,
  getRecommendedAction,
  getSpecificWarningReason,
  getVoiceWarning,
} from "../utils/clearanceWarnings";

type Props = {
  clearanceItems: ClearanceItem[];
  compact?: boolean;
  showVoiceButton?: boolean;
  distanceSource?: DistanceSource;
  stopRecoveryConfirmed?: boolean;
  onChangeStopRecoveryConfirmed?: (value: boolean) => void;
  onResetDistances?: () => void;
};

export function DistanceWarningSummaryCard({
  clearanceItems,
  compact = false,
  showVoiceButton = true,
  distanceSource,
  stopRecoveryConfirmed = false,
  onChangeStopRecoveryConfirmed,
  onResetDistances,
}: Props) {
  const worstLevel = useMemo<ClearanceLevel>(() => {
    const levels = clearanceItems.map((item) => getClearanceLevel(item.value));

    if (levels.includes("stop")) {
      return "stop";
    }

    if (levels.includes("caution")) {
      return "caution";
    }

    return "safe";
  }, [clearanceItems]);

  const warningReason = useMemo(() => {
    return getSpecificWarningReason(clearanceItems);
  }, [clearanceItems]);

  const recommendedAction = getRecommendedAction(worstLevel);
  const levelStyles = getLevelStyles(worstLevel);

  const voiceWarning = getVoiceWarning(
    worstLevel,
    warningReason,
    recommendedAction,
  );

  /*
   * Convert the source to plain text before checking it.
   * This prevents TypeScript errors when DistanceSource does not
   * contain the exact literal value "lidar".
   */
  const distanceSourceText = String(distanceSource ?? "manual").toLowerCase();

  const isLidarSource = distanceSourceText.includes("lidar");

  const distanceSourceLabel = isLidarSource ? "Test LiDAR" : "Manual";

  const speakWarning = async () => {
    try {
      await Speech.stop();

      setTimeout(() => {
        Speech.speak(voiceWarning, {
          language: "en-US",
          rate: 0.9,
          pitch: 1,
        });
      }, 150);
    } catch {
      Speech.speak(voiceWarning, {
        language: "en-US",
        rate: 0.9,
        pitch: 1,
      });
    }
  };

  /*
   * Lean SAFE card
   *
   * SAFE only shows:
   * - status
   * - a short clearance message
   * - distance source
   *
   * It does not show warning, action, recovery, or voice controls.
   */
  if (worstLevel === "safe") {
    return (
      <View
        style={{
          marginTop: compact ? 6 : 10,
          paddingVertical: compact ? 7 : 9,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: levelStyles.backgroundColor,
          borderWidth: 1,
          borderColor: levelStyles.borderColor,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: compact ? 13 : 14,
              fontWeight: "900",
              color: levelStyles.textColor,
              marginRight: 7,
            }}
          >
            ✓ SAFE
          </Text>

          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: compact ? 11 : 12,
              fontWeight: "700",
              color: levelStyles.textColor,
            }}
          >
            Clearances are within the safe range
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 3,
            paddingHorizontal: 7,
            borderRadius: 999,
            backgroundColor: isLidarSource
              ? "#ecfeff"
              : "rgba(255,255,255,0.7)",
            borderWidth: 1,
            borderColor: isLidarSource ? "#06b6d4" : levelStyles.borderColor,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "900",
              color: isLidarSource ? "#0e7490" : levelStyles.textColor,
            }}
          >
            {distanceSourceLabel}
          </Text>
        </View>

        {onResetDistances ? (
          <TouchableOpacity
            onPress={onResetDistances}
            activeOpacity={0.8}
            style={{
              marginLeft: 7,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: levelStyles.borderColor,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: levelStyles.textColor,
              }}
            >
              Reset
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  const showStopRecovery =
    worstLevel === "stop" && !compact && Boolean(onChangeStopRecoveryConfirmed);

  return (
    <View
      style={{
        marginTop: compact ? 8 : 12,
        padding: compact ? 10 : 12,
        borderRadius: 14,
        backgroundColor: levelStyles.backgroundColor,
        borderWidth: 1,
        borderColor: levelStyles.borderColor,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: compact ? 13 : 16,
            fontWeight: "900",
            color: levelStyles.textColor,
            marginRight: 8,
          }}
        >
          {levelStyles.label}
        </Text>

        <View
          style={{
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: isLidarSource ? "#ecfeff" : "#f1f5f9",
            borderWidth: 1,
            borderColor: isLidarSource ? "#06b6d4" : "#cbd5e1",
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "900",
              color: isLidarSource ? "#0e7490" : "#475569",
            }}
          >
            {distanceSourceLabel}
          </Text>
        </View>

        {onResetDistances ? (
          <TouchableOpacity
            onPress={onResetDistances}
            activeOpacity={0.8}
            style={{
              marginLeft: 7,
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: levelStyles.borderColor,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: levelStyles.textColor,
              }}
            >
              Reset
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!compact ? (
        <Text
          style={{
            marginTop: 5,
            fontSize: 12,
            fontWeight: "800",
            color: levelStyles.textColor,
            lineHeight: 17,
          }}
        >
          {levelStyles.message}
        </Text>
      ) : null}

      <View
        style={{
          marginTop: 9,
          padding: compact ? 8 : 10,
          borderRadius: 11,
          backgroundColor: "rgba(255,255,255,0.75)",
          borderWidth: 1,
          borderColor: levelStyles.borderColor,
        }}
      >
        <Text
          style={{
            fontSize: compact ? 11 : 12,
            fontWeight: "900",
            color: levelStyles.textColor,
            lineHeight: compact ? 15 : 17,
          }}
        >
          {warningReason}
        </Text>
      </View>

      <View
        style={{
          marginTop: 8,
          padding: compact ? 8 : 10,
          borderRadius: 11,
          backgroundColor: "rgba(255,255,255,0.55)",
          borderWidth: 1,
          borderColor: levelStyles.borderColor,
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "900",
            color: levelStyles.textColor,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          Next action
        </Text>

        <Text
          style={{
            marginTop: 3,
            fontSize: compact ? 11 : 12,
            fontWeight: "800",
            color: levelStyles.textColor,
            lineHeight: compact ? 15 : 17,
          }}
        >
          {recommendedAction}
        </Text>
      </View>

      {showStopRecovery ? (
        <View
          style={{
            marginTop: 9,
            padding: 10,
            borderRadius: 11,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderWidth: 1,
            borderColor: levelStyles.borderColor,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "900",
              color: levelStyles.textColor,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            STOP recovery
          </Text>

          {!stopRecoveryConfirmed ? (
            <>
              <Text
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  fontWeight: "800",
                  color: levelStyles.textColor,
                  lineHeight: 17,
                }}
              >
                Do not move. Get out and inspect the closest obstacle.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  onChangeStopRecoveryConfirmed?.(true);
                }}
                activeOpacity={0.85}
                style={{
                  marginTop: 8,
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  backgroundColor: levelStyles.textColor,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "900",
                  }}
                >
                  I got out and checked
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: 10,
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
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  Recovery check confirmed
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: "800",
                    color: "#166534",
                    textAlign: "center",
                    lineHeight: 17,
                  }}
                >
                  Pull forward slowly if clearance remains tight. Re-check
                  before backing again.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  onChangeStopRecoveryConfirmed?.(false);
                }}
                activeOpacity={0.85}
                style={{
                  marginTop: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: levelStyles.borderColor,
                }}
              >
                <Text
                  style={{
                    color: levelStyles.textColor,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "900",
                  }}
                >
                  Reset recovery
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      {showVoiceButton ? (
        <TouchableOpacity
          onPress={speakWarning}
          activeOpacity={0.85}
          style={{
            marginTop: compact ? 8 : 10,
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: levelStyles.textColor,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            🔊 Speak warning
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
