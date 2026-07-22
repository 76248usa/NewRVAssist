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
import { SavedRigSetupCard } from "../components/SavedRigSetupCard";
import { SetupReviewCard } from "../components/SetupReviewCard";
import {
  SiteObstacle,
  SiteObstacleSelector,
} from "../components/SiteObstacleSelector";
import { ParkingType, guidanceByType } from "../constants/parkingGuidance";
import { ClearanceValues } from "../types/clearance";
import { DistanceSource } from "../types/lidar";

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

  const [clearanceValues, setClearanceValues] = useState<ClearanceValues>({
    left: "",
    right: "",
    rear: "",
    roof: "",
  });

  const [distanceSource, setDistanceSource] =
    useState<DistanceSource>("manual");

  const [stopRecoveryConfirmed, setStopRecoveryConfirmed] = useState(false);
  const handleStopRecoveryConfirmedChange = (value: boolean) => {
    setStopRecoveryConfirmed(value);
  };
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
        <SavedRigSetupCard
          truckLength={truckLength}
          trailerLength={trailerLength}
          totalLength={totalLength}
          backingSide={backingSide}
          scenario={scenario}
          onEditSetup={startEditingRigSetup}
        />
      )}
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
      <SiteObstacleSelector obstacles={obstacles} setObstacles={setObstacles} />
      <SetupReviewCard
        parkingType={parkingType}
        backingSide={backingSide}
        scenario={scenario}
        campsiteType={campsiteType}
        obstacles={obstacles}
      />
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
              fontWeight: "900",
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
              fontWeight: "800",
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
      />
      <ReadyToBackChecklistCard
        parkingType={parkingType}
        obstacles={obstacles}
      />

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

      <LidarReadinessCard
        manualModeActive={true}
        clearanceValues={clearanceValues}
        distanceSource={distanceSource}
        stopRecoveryConfirmed={stopRecoveryConfirmed}
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
      />
      <AppFooterDisclaimer />
    </ScrollView>
  );
}
