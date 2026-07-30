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
  if (obstacles.length === 0) return "No obstacles";

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
  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
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
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Smart Coach Active
      </Text>

      <View
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 16,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#cbd5e1",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: "#0f172a",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            textAlign: "center",
          }}
        >
          Use Mode
        </Text>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => setAppMode("parking")}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: appMode === "parking" ? "#16a34a" : "#f1f5f9",
              borderWidth: 1,
              borderColor: appMode === "parking" ? "#16a34a" : "#cbd5e1",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: "900",
                color: appMode === "parking" ? "white" : "#475569",
              }}
            >
              Parking Coach
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAppMode("practice")}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 10,
              borderRadius: 12,
              backgroundColor: appMode === "practice" ? "#7c3aed" : "#f1f5f9",
              borderWidth: 1,
              borderColor: appMode === "practice" ? "#7c3aed" : "#cbd5e1",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 12,
                fontWeight: "900",
                color: appMode === "practice" ? "white" : "#475569",
              }}
            >
              Practice Simulator
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: "800",
            color: "#475569",
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          {appMode === "parking"
            ? "Real parking view: next action, LiDAR, and safety guidance."
            : "Practice view: simulator controls, jackknife practice, and recovery training."}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          fontWeight: "900",
          color: "#0f172a",
          lineHeight: 19,
        }}
      >
        {parkingType === "pull-through"
          ? `${getParkingTypeLabel(parkingType)} • Drive-through guidance`
          : `${getParkingTypeLabel(parkingType)} • ${getBackingSideLabel(
              backingSide,
            )} • ${getCampsiteLabel(campsiteType)}`}
      </Text>

      <Text
        style={{
          marginTop: 4,
          fontSize: 12,
          fontWeight: "800",
          color: "#475569",
          lineHeight: 17,
        }}
      >
        {getScenarioLabel(scenario)} difficulty •{getObstacleSummary(obstacles)}
      </Text>
    </View>
  );
}
