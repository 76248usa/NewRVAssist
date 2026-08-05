import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ParkingType } from "../constants/parkingGuidance";
import { CampsiteType } from "./CampsiteSetupCard";
import { SiteObstacle } from "./SiteObstacleSelector";

type Scenario = "easy" | "normal" | "tight";

type Props = {
  parkingType: ParkingType;
  backingSide: "left" | "right";
  campsiteType: CampsiteType;
  obstacles: SiteObstacle[];
  scenario: Scenario;
  appMode: "parking" | "practice";
  setAppMode: (mode: "parking" | "practice") => void;
};

function getParkingTypeLabel(parkingType: ParkingType) {
  if (parkingType === "back-in") return "Back-in";
  if (parkingType === "pull-through") return "Pull-through";
  return "Parking";
}

function getBackingSideLabel(backingSide: "left" | "right") {
  return backingSide === "left" ? "Left-side" : "Right-side";
}

function getCampsiteLabel(campsiteType: CampsiteType) {
  if (campsiteType === "straightBackIn") return "Straight back-in";
  if (campsiteType === "angledSite") return "Angled site";
  if (campsiteType === "tightCampgroundRoad") return "Tight road";
  return "Narrow driveway";
}

function getScenarioLabel(scenario: Scenario) {
  if (scenario === "easy") return "Easy";
  if (scenario === "tight") return "Tight";
  return "Normal";
}

function getObstacleSummary(obstacles: SiteObstacle[]) {
  if (obstacles.length === 0) return "No obstacles selected";

  const labels: string[] = [];

  if (obstacles.includes("poleRight")) labels.push("Pole right");
  if (obstacles.includes("treeLeft")) labels.push("Tree left");
  if (obstacles.includes("lowBranch")) labels.push("Low branch");
  if (obstacles.includes("tightHookupSide")) labels.push("Hookup side");

  return labels.join(" • ");
}

export function CurrentCoachModeCard({
  parkingType,
  backingSide,
  campsiteType,
  obstacles,
  scenario,
  appMode,
  setAppMode,
}: Props) {
  const isParkingMode = appMode === "parking";
  const isPracticeMode = appMode === "practice";

  const setupSummary =
    parkingType === "pull-through"
      ? `${getParkingTypeLabel(parkingType)} • Drive-through guidance`
      : `${getParkingTypeLabel(parkingType)} • ${getBackingSideLabel(
          backingSide,
        )} • ${getCampsiteLabel(campsiteType)}`;

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#f8faff",
        borderWidth: 1,
        borderColor: "#dbe4ff",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            marginRight: 9,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#e0e7ff",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 14,
              lineHeight: 16,
              includeFontPadding: false,
            }}
          >
            🧭
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#3730a3",
              letterSpacing: 0.2,
            }}
          >
            Smart Coach
          </Text>

          <Text
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: "400",
              color: "#6366a3",
              lineHeight: 15,
            }}
          >
            Guidance is adjusted to your current setup.
          </Text>
        </View>

        <View
          style={{
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: "#eef2ff",
            borderWidth: 1,
            borderColor: "#c7d2fe",
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "500",
              color: "#4338ca",
            }}
          >
            Active
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 11,
          padding: 10,
          borderRadius: 12,
          backgroundColor: "#ffffff",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: "#334155",
            marginBottom: 8,
          }}
        >
          Coach mode
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setAppMode("parking")}
            activeOpacity={0.82}
            style={{
              flex: 1,
              minHeight: 68,
              paddingVertical: 9,
              paddingHorizontal: 8,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isParkingMode ? "#f0fdf4" : "#f8fafc",
              borderWidth: isParkingMode ? 2 : 1,
              borderColor: isParkingMode ? "#16a34a" : "#dbe3ef",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              🚐
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: isParkingMode ? "700" : "500",
                color: isParkingMode ? "#166534" : "#475569",
              }}
            >
              Parking Coach
            </Text>

            {isParkingMode ? (
              <Text
                style={{
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: "500",
                  color: "#15803d",
                }}
              >
                Selected
              </Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAppMode("practice")}
            activeOpacity={0.82}
            style={{
              flex: 1,
              minHeight: 68,
              paddingVertical: 9,
              paddingHorizontal: 8,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isPracticeMode ? "#f5f3ff" : "#f8fafc",
              borderWidth: isPracticeMode ? 2 : 1,
              borderColor: isPracticeMode ? "#7c3aed" : "#dbe3ef",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                marginBottom: 4,
              }}
            >
              🎮
            </Text>

            <Text
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: isPracticeMode ? "700" : "500",
                color: isPracticeMode ? "#5b21b6" : "#475569",
              }}
            >
              Practice Simulator
            </Text>

            {isPracticeMode ? (
              <Text
                style={{
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: "500",
                  color: "#6d28d9",
                }}
              >
                Selected
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: "400",
            color: "#64748b",
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          {isParkingMode
            ? "Real parking guidance with next actions, distance checks, and safety coaching."
            : "Simulator controls for steering, jackknife prevention, and recovery practice."}
        </Text>
      </View>

      <View
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#e0e7ff",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#0f172a",
            lineHeight: 17,
          }}
        >
          {setupSummary}
        </Text>

        <Text
          style={{
            marginTop: 4,
            fontSize: 11,
            fontWeight: "400",
            color: "#64748b",
            lineHeight: 16,
          }}
        >
          {getScenarioLabel(scenario)} difficulty
        </Text>

        <Text
          style={{
            marginTop: 2,
            fontSize: 11,
            fontWeight: obstacles.length > 0 ? "500" : "400",
            color: obstacles.length > 0 ? "#92400e" : "#64748b",
            lineHeight: 16,
          }}
        >
          {getObstacleSummary(obstacles)}
        </Text>
      </View>
    </View>
  );
}
