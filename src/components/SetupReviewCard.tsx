import React, { useState } from "react";
import { Text, View } from "react-native";
import { ParkingType } from "../constants/parkingGuidance";
import { CampsiteType } from "./CampsiteSetupCard";
import { SiteObstacle } from "./SiteObstacleSelector";

type Scenario = "easy" | "normal" | "tight";

type Props = {
  parkingType: ParkingType;
  backingSide: "left" | "right";
  scenario: Scenario;
  campsiteType: CampsiteType;
  obstacles: SiteObstacle[];
};

function getParkingTypeLabel(parkingType: ParkingType) {
  if (parkingType === "back-in") return "Back-in";
  if (parkingType === "pull-through") return "Pull-through";
  return "Parking";
}

function getBackingSideLabel(backingSide: "left" | "right") {
  return backingSide === "left" ? "Left-side" : "Right-side";
}

function getFullBackingSideLabel(backingSide: "left" | "right") {
  return backingSide === "left" ? "Left-side backing" : "Right-side backing";
}

function getScenarioLabel(scenario: Scenario) {
  if (scenario === "easy") return "Easy difficulty";
  if (scenario === "tight") return "Tight difficulty";
  return "Normal difficulty";
}

function getShortScenarioLabel(scenario: Scenario) {
  if (scenario === "easy") return "Easy";
  if (scenario === "tight") return "Tight";
  return "Normal";
}

function getCampsiteLabel(campsiteType: CampsiteType) {
  if (campsiteType === "straightBackIn") return "Straight back-in campsite";
  if (campsiteType === "angledSite") return "Angled campsite";
  if (campsiteType === "tightCampgroundRoad") return "Tight campground road";
  return "Narrow driveway";
}

function getShortCampsiteLabel(campsiteType: CampsiteType) {
  if (campsiteType === "straightBackIn") return "Straight back-in";
  if (campsiteType === "angledSite") return "Angled site";
  if (campsiteType === "tightCampgroundRoad") return "Tight road";
  return "Narrow driveway";
}

function getObstacleLabels(obstacles: SiteObstacle[]) {
  const labels: string[] = [];

  if (obstacles.includes("poleRight")) {
    labels.push("Pole right");
  }

  if (obstacles.includes("treeLeft")) {
    labels.push("Tree left");
  }

  if (obstacles.includes("lowBranch")) {
    labels.push("Low branch");
  }

  if (obstacles.includes("tightHookupSide")) {
    labels.push("Tight hookup side");
  }

  if (labels.length === 0) {
    return "No specific obstacles selected";
  }

  return labels.join(" • ");
}

function getShortObstacleLabels(obstacles: SiteObstacle[]) {
  if (obstacles.length === 0) {
    return "No obstacles selected";
  }

  const labels: string[] = [];

  if (obstacles.includes("poleRight")) labels.push("Pole right");
  if (obstacles.includes("treeLeft")) labels.push("Tree left");
  if (obstacles.includes("lowBranch")) labels.push("Low branch");
  if (obstacles.includes("tightHookupSide")) labels.push("Hookup side");

  return labels.join(" • ");
}

function getSetupReminder(
  parkingType: ParkingType,
  campsiteType: CampsiteType,
  scenario: Scenario,
  obstacles: SiteObstacle[],
) {
  if (parkingType === "pull-through") {
    if (obstacles.includes("lowBranch")) {
      return "Pull through slowly and confirm roof and A/C clearance before entering farther.";
    }

    if (obstacles.includes("poleRight")) {
      return "Pull through slowly and keep extra clearance on the right side.";
    }

    if (obstacles.includes("treeLeft")) {
      return "Pull through slowly and keep extra clearance on the left side.";
    }

    return "Pull through slowly, stay centered, watch both sides, and stop before the rear of the trailer swings near obstacles.";
  }

  if (obstacles.includes("lowBranch")) {
    return "Confirm roof and A/C clearance before backing farther. Stop and get out to look if overhead clearance is uncertain.";
  }

  if (obstacles.includes("poleRight")) {
    return "Keep extra clearance on the right side and check the right mirror often.";
  }

  if (obstacles.includes("treeLeft")) {
    return "Keep the trailer angle shallow and check the left mirror often.";
  }

  if (campsiteType === "tightCampgroundRoad") {
    return "Use small steering corrections and pull forward early if the trailer angle gets sharp or the truck runs out of swing room.";
  }

  if (campsiteType === "angledSite") {
    return "Let the trailer follow the campsite angle first, then straighten gradually once it is entering the site.";
  }

  if (campsiteType === "narrowDriveway") {
    return "Keep the rig as straight as possible and use very small steering corrections. Stop often to check both sides.";
  }

  if (scenario === "tight") {
    return "Treat this as a tight setup. Move slowly, correct early, and pull forward before the trailer angle becomes severe.";
  }

  return "Move slowly, watch both mirrors, and reset early if the setup does not look right.";
}

export function SetupReviewCard({
  parkingType,
  backingSide,
  scenario,
  campsiteType,
  obstacles,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const parkingTypeLabel = getParkingTypeLabel(parkingType);
  const backingSideLabel = getBackingSideLabel(backingSide);
  const fullBackingSideLabel = getFullBackingSideLabel(backingSide);
  const scenarioLabel = getScenarioLabel(scenario);
  const shortScenarioLabel = getShortScenarioLabel(scenario);
  const campsiteLabel = getCampsiteLabel(campsiteType);
  const shortCampsiteLabel = getShortCampsiteLabel(campsiteType);
  const obstacleLabels = getObstacleLabels(obstacles);
  const shortObstacleLabels = getShortObstacleLabels(obstacles);

  const setupReminder = getSetupReminder(
    parkingType,
    campsiteType,
    scenario,
    obstacles,
  );
  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#cbd5e1",
        overflow: "hidden",
      }}
    >
      {/* <TouchableOpacity
        onPress={() => setExpanded((current) => !current)}
        activeOpacity={0.85}
        style={{
          padding: 14,
          backgroundColor: "#f8fafc",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Setup Review
            </Text>

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
                fontWeight: "700",
                color: "#475569",
                lineHeight: 17,
              }}
            >
              {shortScenarioLabel} • {shortObstacleLabels}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: "#334155",
            }}
          >
            {expanded ? "⌃" : "⌄"}
          </Text>
        </View>

        <Text
          style={{
            marginTop: 6,
            fontSize: 11,
            fontWeight: "800",
            color: "#64748b",
          }}
        >
          {expanded ? "Tap to hide details" : "Tap for details"}
        </Text>
      </TouchableOpacity> */}

      {expanded ? (
        <View style={{ padding: 14, paddingTop: 0 }}>
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: "#0f172a",
                lineHeight: 20,
              }}
            >
              {parkingType === "pull-through"
                ? `${parkingTypeLabel} • Drive-through guidance`
                : `${parkingTypeLabel} • ${fullBackingSideLabel}`}
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "800",
                color: "#334155",
                lineHeight: 18,
              }}
            >
              {parkingType === "pull-through"
                ? scenarioLabel
                : `${campsiteLabel} • ${scenarioLabel}`}
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "700",
                color: "#475569",
                lineHeight: 18,
              }}
            >
              Obstacles: {obstacleLabels}
            </Text>
          </View>
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "#eff6ff",
              borderWidth: 1,
              borderColor: "#bfdbfe",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "900",
                color: "#1d4ed8",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Coach Reminder
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "800",
                color: "#0f172a",
                lineHeight: 18,
              }}
            >
              {setupReminder}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
