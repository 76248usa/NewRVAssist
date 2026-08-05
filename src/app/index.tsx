"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { AppFooterDisclaimer } from "../components/AppFooterDisclaimer";
import { AppHeaderCard } from "../components/AppHeaderCard";
import {
  CampsiteSetupCard,
  CampsiteType,
} from "../components/CampsiteSetupCard";
import { CurrentCoachModeCard } from "../components/CurrentCoachModeCard";
import { GuidanceCard } from "../components/GuidanceCard";
import { HowToUseCard } from "../components/HowToUseCard";
import { LidarReadinessCard } from "../components/LidarReadinessCard";
import { ObstacleDistanceInputCard } from "../components/ObstacleDistanceInputCard";
import { ParkingTypeSelector } from "../components/ParkingTypeSelector";
import { ReadyToBackChecklistCard } from "../components/ReadyToBackChecklistCard";
import { RigSetupCard } from "../components/RigSetupCard";
import { SafetyDisclaimerCard } from "../components/SafetyDisclaimerCard";
import {
  SiteObstacle,
  SiteObstacleSelector,
} from "../components/SiteObstacleSelector";
import { ParkingType, guidanceByType } from "../constants/parkingGuidance";
import { ClearanceValues } from "../types/clearance";
import { DistanceSource } from "../types/lidar";
import { getClearanceLevel, parseDistance } from "../utils/clearanceWarnings";

const RIG_SETUP_STORAGE_KEY = "rvParkingRigSetup";

type SavedRigSetup = {
  truckLength: string;
  trailerLength: string;
};

function getObstacleWarning(obstacles: SiteObstacle[]) {
  const warnings: string[] = [];

  if (obstacles.includes("poleRight")) {
    warnings.push("🚧 Pole right: start wider");
  }

  if (obstacles.includes("treeLeft")) {
    warnings.push("🌳 Tree left: shallow angle");
  }

  if (obstacles.includes("lowBranch")) {
    warnings.push("🌿 Low branch: check roof");
  }

  if (obstacles.includes("tightHookupSide")) {
    warnings.push("⚡ Hookup side: leave room");
  }

  return warnings;
}

function getParkingTypeLabel(parkingType: ParkingType) {
  if (parkingType === "pull-through") return "Pull-through";
  return "Back-in";
}

function getCampsiteTypeLabel(campsiteType: CampsiteType) {
  if (campsiteType === "angledSite") return "Angled site";
  if (campsiteType === "tightCampgroundRoad") return "Tight campground road";
  if (campsiteType === "narrowDriveway") return "Narrow driveway";
  return "Straight back-in";
}

function getBackingSideLabel(side: "left" | "right") {
  return side === "left" ? "Driver side backing" : "Passenger side backing";
}

function getObstacleLabel(obstacle: SiteObstacle) {
  if (obstacle === "poleRight") return "Pole right";
  if (obstacle === "treeLeft") return "Tree left";
  if (obstacle === "lowBranch") return "Low branch";
  if (obstacle === "tightHookupSide") return "Tight hookup side";
  return obstacle;
}

type CompactSetupSummaryCardProps = {
  truckLength: string;
  trailerLength: string;
  totalLength: number;
  backingSide: "left" | "right";
  setBackingSide: (side: "left" | "right") => void;
  scenario: "easy" | "normal" | "tight";
  parkingType: ParkingType;
  selectParkingType: (type: ParkingType) => void;
  campsiteType: CampsiteType;
  setCampsiteType: (value: CampsiteType) => void;
  obstacles: SiteObstacle[];
  setObstacles: (value: SiteObstacle[]) => void;
  onEditRigSetup: () => void;
};

function CompactSetupSummaryCard({
  truckLength,
  trailerLength,
  totalLength,
  backingSide,
  setBackingSide,
  scenario,
  parkingType,
  selectParkingType,
  campsiteType,
  setCampsiteType,
  obstacles,
  setObstacles,
  onEditRigSetup,
}: CompactSetupSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const obstacleText =
    obstacles.length === 0
      ? "None selected"
      : obstacles.map(getObstacleLabel).join(", ");

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#dbe3ef",
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.82}
        style={{
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flex: 1,
            marginRight: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#334155",
              letterSpacing: 0.2,
            }}
          >
            Setup
          </Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: "600",
              color: "#0f172a",
              lineHeight: 18,
            }}
          >
            {getParkingTypeLabel(parkingType)}
            {parkingType === "back-in"
              ? ` • ${getCampsiteTypeLabel(campsiteType)}`
              : ""}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: "400",
              color: "#64748b",
              lineHeight: 16,
            }}
          >
            {getBackingSideLabel(backingSide)} • {totalLength} ft • {scenario}
          </Text>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: expanded ? "#e0f2fe" : "#eef2f7",
            borderWidth: 1,
            borderColor: expanded ? "#38bdf8" : "#cbd5e1",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: expanded ? "#075985" : "#475569",
              textAlign: "center",
              lineHeight: 18,
              includeFontPadding: false,
              transform: [{ translateY: -1 }],
            }}
          >
            {expanded ? "−" : "+"}
          </Text>
        </View>
      </TouchableOpacity>

      <View
        style={{
          paddingHorizontal: 12,
          paddingBottom: 12,
          gap: 5,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: "400",
            color: "#475569",
            lineHeight: 16,
          }}
        >
          Truck {truckLength} ft + trailer {trailerLength} ft = {totalLength} ft
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: "400",
            color: "#475569",
            lineHeight: 16,
          }}
        >
          Backing side: {getBackingSideLabel(backingSide)}
        </Text>

        <Text
          style={{
            fontSize: 11,
            fontWeight: obstacles.length > 0 ? "600" : "400",
            color: obstacles.length > 0 ? "#92400e" : "#64748b",
            lineHeight: 16,
          }}
        >
          Obstacles: {obstacleText}
        </Text>
      </View>

      {expanded ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
          }}
        >
          <View
            style={{
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: "#e2e8f0",
            }}
          >
            <TouchableOpacity
              onPress={onEditRigSetup}
              activeOpacity={0.82}
              style={{
                padding: 11,
                borderRadius: 11,
                backgroundColor: "#eff6ff",
                borderWidth: 1,
                borderColor: "#bfdbfe",
              }}
            >
              <Text
                style={{
                  color: "#1d4ed8",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Edit rig dimensions
              </Text>
            </TouchableOpacity>

            <ParkingTypeSelector
              parkingType={parkingType}
              selectParkingType={selectParkingType}
            />

            {parkingType === "back-in" ? (
              <CampsiteSetupCard
                campsiteType={campsiteType}
                setCampsiteType={setCampsiteType}
              />
            ) : null}

            {parkingType === "back-in" ? (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: 8,
                  }}
                >
                  Backing side
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  {(["left", "right"] as const).map((side) => {
                    const selected = backingSide === side;

                    return (
                      <TouchableOpacity
                        key={side}
                        onPress={() => setBackingSide(side)}
                        activeOpacity={0.82}
                        style={{
                          flex: 1,
                          padding: 11,
                          borderRadius: 11,
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected ? "#0f766e" : "#cbd5e1",
                          backgroundColor: selected ? "#ccfbf1" : "white",
                        }}
                      >
                        <Text
                          style={{
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: selected ? "700" : "500",
                            color: selected ? "#115e59" : "#475569",
                          }}
                        >
                          {side === "left" ? "Driver side" : "Passenger side"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    fontWeight: "400",
                    color: "#64748b",
                    lineHeight: 16,
                  }}
                >
                  Choose the side from which the trailer will enter the site.
                </Text>
              </View>
            ) : null}

            <SiteObstacleSelector
              obstacles={obstacles}
              setObstacles={setObstacles}
            />

            <ReadyToBackChecklistCard
              parkingType={parkingType}
              obstacles={obstacles}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

type BigNextActionCardProps = {
  stepIndex: number;
  totalSteps: number;
  currentStep: unknown;
  obstacles: SiteObstacle[];
  clearanceValues: ClearanceValues;
  distanceSource: DistanceSource;
};

function getStepText(currentStep: unknown) {
  if (typeof currentStep === "object" && currentStep !== null) {
    const step = currentStep as {
      title?: string;
      instruction?: string;
      direction?: string;
      description?: string;
      text?: string;
    };

    return (
      step.instruction ||
      step.direction ||
      step.description ||
      step.text ||
      step.title ||
      "Back slowly and follow the coach."
    );
  }

  return "Back slowly and follow the coach.";
}

function getObstacleWatchText(obstacles: SiteObstacle[]) {
  if (obstacles.length === 0) {
    return "Mirrors, rear clearance, and campsite edges.";
  }

  return obstacles
    .map((obstacle) => {
      if (obstacle === "treeLeft") return "tree on left";
      if (obstacle === "poleRight") return "pole on right";
      if (obstacle === "lowBranch") return "low branch / roof";
      return "tight hookup side";
    })
    .join(" • ");
}

function getRearStatusText(
  clearanceValues: ClearanceValues,
  distanceSource: DistanceSource,
) {
  const rear = clearanceValues.rear.trim();

  if (!rear) {
    return distanceSource === "real-lidar"
      ? "Waiting for rear LiDAR reading."
      : "No rear distance entered yet.";
  }

  return `Rear clearance: ${rear} inches from ${
    distanceSource === "real-lidar"
      ? "Real LiDAR"
      : distanceSource === "test-lidar"
        ? "Test LiDAR"
        : "Manual Backup"
  }.`;
}

function BigNextActionCard({
  stepIndex,
  totalSteps,
  currentStep,
  obstacles,
  clearanceValues,
  distanceSource,
}: BigNextActionCardProps) {
  const rearDistanceNumber = parseDistance(clearanceValues.rear);
  const rearLevel = getClearanceLevel(rearDistanceNumber);

  const lidarSourceText =
    distanceSource === "real-lidar"
      ? "Real LiDAR"
      : distanceSource === "test-lidar"
        ? "Test LiDAR"
        : "Manual Backup";

  const normalNextActionText = getStepText(currentStep);
  const watchText = getObstacleWatchText(obstacles);
  const rearStatusText = getRearStatusText(clearanceValues, distanceSource);

  const isStopOverride = rearLevel === "stop" && rearDistanceNumber !== null;
  const isCautionOverride =
    rearLevel === "caution" && rearDistanceNumber !== null;

  const cardBackgroundColor = isStopOverride
    ? "#fee2e2"
    : isCautionOverride
      ? "#fef3c7"
      : "#f0fdf4";

  const cardBorderColor = isStopOverride
    ? "#dc2626"
    : isCautionOverride
      ? "#f59e0b"
      : "#bbf7d0";

  const titleColor = isStopOverride
    ? "#991b1b"
    : isCautionOverride
      ? "#92400e"
      : "#166534";

  const nextActionText = isStopOverride
    ? "STOP NOW"
    : isCautionOverride
      ? "Back in inches only."
      : normalNextActionText;

  const watchOverrideText = isStopOverride
    ? `Rear clearance is ${Math.round(
        rearDistanceNumber,
      )} inches from ${lidarSourceText}.`
    : isCautionOverride
      ? `Rear clearance is ${Math.round(
          rearDistanceNumber,
        )} inches. Watch rear clearance and selected obstacles.`
      : watchText;

  const stopIfText = isStopOverride
    ? "Already stopped. Get out and inspect before moving again."
    : isCautionOverride
      ? "Stop if the distance keeps shrinking, LiDAR says STOP, or the spotter tells you to stop."
      : "LiDAR says STOP, Auto Stop triggers, or the spotter tells you to stop.";

  const statusLine = isStopOverride
    ? `Step ${stepIndex + 1} of ${totalSteps} • STOP override active`
    : isCautionOverride
      ? `Step ${stepIndex + 1} of ${totalSteps} • CAUTION override active`
      : `Step ${stepIndex + 1} of ${totalSteps} • ${rearStatusText}`;

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: cardBackgroundColor,
        borderWidth: 1,
        borderColor: cardBorderColor,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: titleColor,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          textAlign: "center",
        }}
      >
        Next Action
      </Text>

      <Text
        style={{
          marginTop: 6,
          fontSize: isStopOverride ? 20 : 14,
          fontWeight: isStopOverride ? "900" : "700",
          color: isStopOverride ? "#991b1b" : "#0f172a",
          lineHeight: isStopOverride ? 25 : 19,
          textAlign: "center",
        }}
      >
        {nextActionText}
      </Text>

      <View
        style={{
          marginTop: 10,
          padding: 9,
          borderRadius: 10,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "800",
            color: titleColor,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          Watch
        </Text>

        <Text
          style={{
            marginTop: 3,
            fontSize: 11,
            fontWeight: "600",
            color: "#334155",
            lineHeight: 16,
          }}
        >
          {watchOverrideText}
        </Text>
      </View>

      <View
        style={{
          marginTop: 8,
          padding: 9,
          borderRadius: 10,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "800",
            color: titleColor,
            textTransform: "uppercase",
            letterSpacing: 0.3,
          }}
        >
          Stop If
        </Text>

        <Text
          style={{
            marginTop: 3,
            fontSize: 11,
            fontWeight: "600",
            color: "#334155",
            lineHeight: 16,
          }}
        >
          {stopIfText}
        </Text>
      </View>

      <Text
        style={{
          marginTop: 8,
          fontSize: 10,
          fontWeight: "600",
          color: titleColor,
          textAlign: "center",
          lineHeight: 14,
        }}
      >
        {statusLine}
      </Text>
    </View>
  );
}

export default function Index() {
  const [truckLength, setTruckLength] = useState("20");
  const [trailerLength, setTrailerLength] = useState("30");
  const CAMPSITE_TYPE_STORAGE_KEY = "rvAssist.campsiteType";
  const OBSTACLES_STORAGE_KEY = "rvAssist.obstacles";
  const PARKING_TYPE_STORAGE_KEY = "rvAssist.parkingType";

  const [draftTruckLength, setDraftTruckLength] = useState("20");
  const [draftTrailerLength, setDraftTrailerLength] = useState("30");

  const [isEditingRigSetup, setIsEditingRigSetup] = useState(false);
  const [parkingType, setParkingType] = useState<ParkingType>("back-in");
  const [stepIndex, setStepIndex] = useState(0);
  const [appMode, setAppMode] = useState<"parking" | "practice">("parking");
  const [backingSide, setBackingSide] = useState<"left" | "right">("left");
  const [scenario, setScenario] = useState<"easy" | "normal" | "tight">(
    "normal",
  );
  const [campsiteType, setCampsiteType] =
    useState<CampsiteType>("straightBackIn");

  const [obstacles, setObstacles] = useState<SiteObstacle[]>([]);

  const totalLength = (Number(truckLength) || 0) + (Number(trailerLength) || 0);
  const draftTotalLength =
    (Number(draftTruckLength) || 0) + (Number(draftTrailerLength) || 0);
  const headerTotalLength = isEditingRigSetup ? draftTotalLength : totalLength;

  const steps = guidanceByType[parkingType] ?? guidanceByType["back-in"];
  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex];

  const obstacleWarnings = getObstacleWarning(obstacles);

  const [clearanceValues, setClearanceValues] = useState<ClearanceValues>({
    left: "",
    right: "",
    rear: "",
    roof: "",
  });

  const [distanceSource, setDistanceSource] =
    useState<DistanceSource>("manual");

  const [stopRecoveryConfirmed, setStopRecoveryConfirmed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRigSetup() {
      try {
        const savedSetup = await AsyncStorage.getItem(RIG_SETUP_STORAGE_KEY);

        if (!mounted || !savedSetup) return;

        const parsed = JSON.parse(savedSetup) as Partial<SavedRigSetup>;

        if (typeof parsed.truckLength === "string") {
          setTruckLength(parsed.truckLength);
          setDraftTruckLength(parsed.truckLength);
        }

        if (typeof parsed.trailerLength === "string") {
          setTrailerLength(parsed.trailerLength);
          setDraftTrailerLength(parsed.trailerLength);
        }
      } catch (error) {
        console.warn("Failed to load rig setup", error);
      }
    }

    loadRigSetup();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function loadSavedCampsiteType() {
      try {
        const savedCampsiteType = await AsyncStorage.getItem(
          CAMPSITE_TYPE_STORAGE_KEY,
        );

        if (
          savedCampsiteType === "straightBackIn" ||
          savedCampsiteType === "angledSite" ||
          savedCampsiteType === "tightCampgroundRoad" ||
          savedCampsiteType === "narrowDriveway"
        ) {
          setCampsiteType(savedCampsiteType);
        }
      } catch (error) {
        console.log("Failed to load saved campsite type", error);
      }
    }

    loadSavedCampsiteType();
  }, []);

  useEffect(() => {
    async function loadSavedObstacles() {
      try {
        const savedObstacles = await AsyncStorage.getItem(
          OBSTACLES_STORAGE_KEY,
        );

        if (!savedObstacles) return;

        const parsedObstacles = JSON.parse(savedObstacles);

        if (!Array.isArray(parsedObstacles)) return;

        const validObstacles = parsedObstacles.filter(
          (obstacle): obstacle is SiteObstacle =>
            obstacle === "treeLeft" ||
            obstacle === "poleRight" ||
            obstacle === "lowBranch" ||
            obstacle === "tightHookupSide",
        );

        setObstacles(validObstacles);
      } catch (error) {
        console.log("Failed to load saved obstacles", error);
      }
    }

    loadSavedObstacles();
  }, []);

  useEffect(() => {
    async function saveObstacles() {
      try {
        await AsyncStorage.setItem(
          OBSTACLES_STORAGE_KEY,
          JSON.stringify(obstacles),
        );
      } catch (error) {
        console.log("Failed to save obstacles", error);
      }
    }

    saveObstacles();
  }, [obstacles]);

  useEffect(() => {
    async function loadSavedParkingType() {
      try {
        const savedParkingType = await AsyncStorage.getItem(
          PARKING_TYPE_STORAGE_KEY,
        );

        if (
          savedParkingType === "back-in" ||
          savedParkingType === "pull-through"
        ) {
          setParkingType(savedParkingType);
        }
      } catch (error) {
        console.log("Failed to load saved parking type", error);
      }
    }

    loadSavedParkingType();
  }, []);

  useEffect(() => {
    async function saveParkingType() {
      try {
        await AsyncStorage.setItem(PARKING_TYPE_STORAGE_KEY, parkingType);
      } catch (error) {
        console.log("Failed to save parking type", error);
      }
    }

    saveParkingType();
  }, [parkingType]);

  useEffect(() => {
    async function saveCampsiteType() {
      try {
        await AsyncStorage.setItem(CAMPSITE_TYPE_STORAGE_KEY, campsiteType);
      } catch (error) {
        console.log("Failed to save campsite type", error);
      }
    }

    saveCampsiteType();
  }, [campsiteType]);

  function selectParkingType(type: ParkingType) {
    setParkingType(type);
    setStepIndex(0);
  }

  function startEditingRigSetup() {
    setDraftTruckLength(truckLength);
    setDraftTrailerLength(trailerLength);
    setIsEditingRigSetup(true);
  }

  async function saveRigSetupNow() {
    const nextTruckLength = draftTruckLength.trim() || "0";
    const nextTrailerLength = draftTrailerLength.trim() || "0";

    try {
      await AsyncStorage.setItem(
        RIG_SETUP_STORAGE_KEY,
        JSON.stringify({
          truckLength: nextTruckLength,
          trailerLength: nextTrailerLength,
          updatedAt: new Date().toISOString(),
        }),
      );

      setTruckLength(nextTruckLength);
      setTrailerLength(nextTrailerLength);
      setDraftTruckLength(nextTruckLength);
      setDraftTrailerLength(nextTrailerLength);
      setIsEditingRigSetup(false);

      console.log("Saved rig setup:", {
        truckLength: nextTruckLength,
        trailerLength: nextTrailerLength,
      });
    } catch (error) {
      console.warn("Failed to save rig setup", error);
    }
  }

  function cancelRigSetupEdit() {
    setDraftTruckLength(truckLength);
    setDraftTrailerLength(trailerLength);
    setIsEditingRigSetup(false);
  }

  function goBack() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  }

  function restartPractice() {
    setStepIndex(0);
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{
        flex: 1,
        backgroundColor: "#f8fafc",
      }}
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 80,
      }}
    >
      <AppHeaderCard totalLength={headerTotalLength} />
      <HowToUseCard />
      <SafetyDisclaimerCard />

      {isEditingRigSetup ? (
        <>
          <RigSetupCard
            truckLength={draftTruckLength}
            setTruckLength={setDraftTruckLength}
            trailerLength={draftTrailerLength}
            setTrailerLength={setDraftTrailerLength}
            totalLength={draftTotalLength}
          />

          <TouchableOpacity
            onPress={saveRigSetupNow}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#16a34a",
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
              ✅ Save Rig Setup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cancelRigSetupEdit}
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                color: "#0f172a",
                textAlign: "center",
                fontSize: 13,
                fontWeight: "900",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <CompactSetupSummaryCard
          truckLength={truckLength}
          trailerLength={trailerLength}
          totalLength={totalLength}
          backingSide={backingSide}
          setBackingSide={setBackingSide}
          scenario={scenario}
          parkingType={parkingType}
          selectParkingType={selectParkingType}
          campsiteType={campsiteType}
          setCampsiteType={setCampsiteType}
          obstacles={obstacles}
          setObstacles={setObstacles}
          onEditRigSetup={startEditingRigSetup}
        />
      )}

      {obstacleWarnings.length > 0 ? (
        <View
          style={{
            backgroundColor: "#fff3cd",
            borderWidth: 1,
            borderColor: "#f0c36d",
            borderRadius: 12,
            padding: 12,
            marginVertical: 10,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#92400e",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Obstacle Coaching
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: "400",
              color: "#92400e",
              lineHeight: 18,
            }}
          >
            {obstacleWarnings.join(" • ")}
          </Text>
        </View>
      ) : null}

      <CurrentCoachModeCard
        parkingType={parkingType}
        backingSide={backingSide}
        campsiteType={campsiteType}
        obstacles={obstacles}
        scenario={scenario}
        appMode={appMode}
        setAppMode={setAppMode}
      />

      <GuidanceCard
        currentStep={currentStep}
        stepIndex={safeStepIndex}
        totalSteps={steps.length}
        backingSide={backingSide}
        setBackingSide={setBackingSide}
        goBack={goBack}
        goNext={goNext}
        restartPractice={restartPractice}
        scenario={scenario}
        setScenario={setScenario}
        obstacles={obstacles}
        campsiteType={campsiteType}
        parkingType={parkingType}
        clearanceValues={clearanceValues}
        distanceSource={distanceSource}
        stopRecoveryConfirmed={stopRecoveryConfirmed}
        appMode={appMode}
      />

      {appMode === "parking" ? (
        <BigNextActionCard
          stepIndex={safeStepIndex}
          totalSteps={steps.length}
          currentStep={currentStep}
          obstacles={obstacles}
          clearanceValues={clearanceValues}
          distanceSource={distanceSource}
        />
      ) : null}

      {appMode === "parking" ? (
        <ObstacleDistanceInputCard
          parkingType={parkingType}
          obstacles={obstacles}
          clearanceValues={clearanceValues}
          onChangeClearanceValues={(values) => {
            setClearanceValues(values);
            setDistanceSource("manual");
          }}
          distanceSource={distanceSource}
          stopRecoveryConfirmed={stopRecoveryConfirmed}
          onChangeStopRecoveryConfirmed={setStopRecoveryConfirmed}
        />
      ) : null}

      {appMode === "parking" ? (
        <LidarReadinessCard
          manualModeActive={true}
          clearanceValues={clearanceValues}
          distanceSource={distanceSource}
          stopRecoveryConfirmed={stopRecoveryConfirmed}
          onChangeStopRecoveryConfirmed={setStopRecoveryConfirmed}
          onApplyTestReading={(values) => {
            setClearanceValues(values);
            setDistanceSource("test-lidar");
            setStopRecoveryConfirmed(false);
          }}
          onApplyRealLidarReading={(values) => {
            setClearanceValues({
              left: values.left,
              right: values.right,
              rear: values.rear,
              roof: values.roof,
            });
            setDistanceSource("real-lidar");
            setStopRecoveryConfirmed(false);
          }}
          onClearTestReading={() => {
            setClearanceValues({
              left: "",
              right: "",
              rear: "",
              roof: "",
            });
            setDistanceSource("manual");
            setStopRecoveryConfirmed(false);
          }}
        />
      ) : null}

      <AppFooterDisclaimer />
    </ScrollView>
  );
}
