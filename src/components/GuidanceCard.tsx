"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { GuidanceStep, ParkingType } from "../constants/parkingGuidance";
import { ClearanceValues } from "../types/clearance";
import { DistanceSource } from "../types/lidar";
import { ClearanceItem, parseDistance } from "../utils/clearanceWarnings";
import { CampsiteType } from "./CampsiteSetupCard";
import { CompactRigStatusRow } from "./CompactRigStatusRow";
import { DistanceWarningSummaryCard } from "./DistanceWarningSummaryCard";
import { GetOutAndLookCard } from "./GetOutAndLookCard";
import { ParkingDiagram } from "./ParkingDiagram";
import { PracticeSession } from "./PracticeHistoryCard";

import { PracticeAction, PracticeModeControls } from "./PracticeModeControls";
import { RecoveryCoachCard } from "./RecoveryCoachCard";
import { SessionStats } from "./SessionStatsCard";
import { SiteObstacle } from "./SiteObstacleSelector";
import { SteeringWheel } from "./SteeringWheel";

const PRACTICE_HISTORY_STORAGE_KEY = "rvParkingPracticeHistory";
const RIG_SETTINGS_STORAGE_KEY = "rvParkingRigSettings";
type Scenario = "easy" | "normal" | "tight";

type SavedRigSettings = {
  backingSide: "left" | "right";
  scenario: Scenario;
};

type Props = {
  currentStep: GuidanceStep;
  stepIndex: number;
  totalSteps: number;
  goBack: () => void;
  goNext: () => void;
  restartPractice: () => void;
  backingSide: "left" | "right";
  setBackingSide: (side: "left" | "right") => void;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  obstacles: SiteObstacle[];
  campsiteType: CampsiteType;
  parkingType: ParkingType;
  clearanceValues: ClearanceValues;
  distanceSource: DistanceSource;
  stopRecoveryConfirmed: boolean;
  appMode: "parking" | "practice";
};

export function GuidanceCard({
  currentStep,
  stepIndex,
  totalSteps,
  goBack,
  goNext,
  restartPractice,
  parkingType,
  backingSide,
  setBackingSide,
  scenario,
  setScenario,
  obstacles,
  campsiteType,
  clearanceValues,
  distanceSource,
  stopRecoveryConfirmed,
  appMode,
}: Props) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [practiceAction, setPracticeAction] = useState<PracticeAction>("idle");
  const [simulatedSteeringAngle, setSimulatedSteeringAngle] = useState(0);
  const [simulatedTruckAngle, setSimulatedTruckAngle] = useState(0);
  const [simulatedTrailerAngle, setSimulatedTrailerAngle] = useState(0);
  const [isRecoveringFromJackknife, setIsRecoveringFromJackknife] =
    useState(false);
  //const [practiceFinished, setPracticeFinished] = useState(false);

  const [hasStartedPractice, setHasStartedPractice] = useState(false);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(
    [],
  );
  const [hasLoadedPracticeHistory, setHasLoadedPracticeHistory] =
    useState(false);
  const hasSavedCurrentSessionRef = useRef(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    backUps: 0,
    pullForwards: 0,
    steeringCorrections: 0,
    autoStops: 0,
    recoveryCompletions: 0,
  });

  const hasSpokenAutoStopRef = useRef(false);
  const hasSpokenRecoveryCompleteRef = useRef(false);
  const hasSpokenResumeBackingRef = useRef(false);
  const hasCountedRecoveryCompleteRef = useRef(false);
  const hasCountedAutoStopRef = useRef(false);
  //const [showControlPad, setShowControlPad] = useState(false);
  const [lastVoiceMessage, setLastVoiceMessage] = useState<string | null>(null);
  const [movementTrail, setMovementTrail] = useState<
    { x: number; y: number; angle: number }[]
  >([]);

  const sideMultiplier = backingSide === "left" ? 1 : -1;

  const fallbackSteeringGuidance =
    stepIndex === 0
      ? "↑ KEEP STRAIGHT"
      : stepIndex === 1
        ? backingSide === "left"
          ? "↶ TURN LEFT"
          : "↷ TURN RIGHT"
        : stepIndex === 2
          ? backingSide === "left"
            ? "↷ TURN RIGHT"
            : "↶ TURN LEFT"
          : stepIndex === 3
            ? "↑ STRAIGHTEN WHEEL"
            : "🛑 STOP";

  const voicePrompt =
    currentStep.voicePrompt ??
    `${fallbackSteeringGuidance}. ${currentStep.title}`;

  const clearanceItems: ClearanceItem[] = [
    {
      key: "left",
      label: "Left side clearance",
      value: parseDistance(clearanceValues.left),
    },
    {
      key: "right",
      label: "Right side clearance",
      value: parseDistance(clearanceValues.right),
    },
    {
      key: "rear",
      label: "Rear clearance",
      value: parseDistance(clearanceValues.rear),
    },
    {
      key: "roof",
      label: "Roof / branch clearance",
      value: parseDistance(clearanceValues.roof),
    },
  ];

  const hasAnyClearanceValue =
    clearanceValues.left.trim() !== "" ||
    clearanceValues.right.trim() !== "" ||
    clearanceValues.rear.trim() !== "" ||
    clearanceValues.roof.trim() !== "";

  function getDriverSteeringGuidance() {
    const guidanceText =
      `${voicePrompt} ${currentStep.title} ${currentStep.instruction}`.toLowerCase();

    if (stepIndex === totalSteps - 1 || guidanceText.includes("stop")) {
      return "🛑 STOP";
    }

    if (
      guidanceText.includes("turn left") ||
      guidanceText.includes("steer left")
    ) {
      return "↶ TURN LEFT";
    }

    if (
      guidanceText.includes("turn right") ||
      guidanceText.includes("steer right")
    ) {
      return "↷ TURN RIGHT";
    }

    if (guidanceText.includes("straighten")) {
      return "↑ STRAIGHTEN WHEEL";
    }

    if (
      guidanceText.includes("keep straight") ||
      guidanceText.includes("stay straight")
    ) {
      return "↑ KEEP STRAIGHT";
    }

    return fallbackSteeringGuidance;
  }

  const steeringGuidance = getDriverSteeringGuidance();

  function getDisplaySteeringAngle() {
    if (steeringGuidance.includes("LEFT")) {
      return -28;
    }

    if (steeringGuidance.includes("RIGHT")) {
      return 28;
    }

    return 0;
  }

  const displaySteeringAngle = getDisplaySteeringAngle();

  const steeringAngle = displaySteeringAngle;

  const trailerAngle =
    stepIndex === 1
      ? 22 * sideMultiplier
      : stepIndex === 2
        ? -18 * sideMultiplier
        : stepIndex === 3
          ? 6 * sideMultiplier
          : 0;

  const truckAngle =
    stepIndex === 1
      ? -10 * sideMultiplier
      : stepIndex === 2
        ? 12 * sideMultiplier
        : stepIndex === 3
          ? 4 * sideMultiplier
          : 0;

  function getSteeringWheelLabel() {
    if (steeringGuidance.includes("LEFT")) {
      return "Turn Left";
    }

    if (steeringGuidance.includes("RIGHT")) {
      return "Turn Right";
    }

    if (steeringGuidance.includes("STRAIGHTEN")) {
      return "Straighten Wheel";
    }

    if (steeringGuidance.includes("STRAIGHT")) {
      return "Keep Straight";
    }

    if (steeringGuidance.includes("STOP")) {
      return "Stop";
    }

    return steeringGuidance;
  }

  const steeringLabel = getSteeringWheelLabel();
  const trainingFeedback =
    stepIndex === 0
      ? "GOOD SETUP"
      : stepIndex === 1
        ? "TRAILER STARTING TO TURN"
        : stepIndex === 2
          ? "FOLLOW THE TRAILER"
          : stepIndex === 3
            ? "STRAIGHTEN NOW"
            : "STOP AND CHECK";

  const feedbackColor =
    stepIndex === totalSteps - 1
      ? "#dc2626"
      : stepIndex === 3
        ? "#f97316"
        : "#16a34a";

  const bannerColor = steeringGuidance === "🛑 STOP" ? "#dc2626" : "#0891b2";

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function moveTowardZero(value: number, amount: number) {
    if (value > 0) return Math.max(0, value - amount);
    if (value < 0) return Math.min(0, value + amount);
    return 0;
  }

  async function saveRigSettings(nextSettings: SavedRigSettings) {
    try {
      await AsyncStorage.setItem(
        RIG_SETTINGS_STORAGE_KEY,
        JSON.stringify(nextSettings),
      );
    } catch (error) {
      console.warn("Failed to save rig settings", error);
    }
  }

  function calculateTrainingScore() {
    const progressScore = Math.round(((stepIndex + 1) / totalSteps) * 10);

    const absTrailerAngle = Math.abs(simulatedTrailerAngle);

    const safeLimit = scenario === "easy" ? 24 : scenario === "tight" ? 14 : 18;
    const warningLimit =
      scenario === "easy" ? 34 : scenario === "tight" ? 24 : 28;

    const trailerPenalty =
      absTrailerAngle <= safeLimit
        ? 0
        : absTrailerAngle <= warningLimit
          ? 8
          : 16;

    const steeringPenalty =
      sessionStats.steeringCorrections <= 6
        ? 0
        : (sessionStats.steeringCorrections - 6) * 2;

    const autoStopPenalty = sessionStats.autoStops * 15;
    const pullForwardPenalty = sessionStats.pullForwards * 3;
    const recoveryBonus = sessionStats.recoveryCompletions * 5;

    const rawScore =
      100 +
      progressScore +
      recoveryBonus -
      trailerPenalty -
      steeringPenalty -
      autoStopPenalty -
      pullForwardPenalty;

    return clamp(Math.round(rawScore), 0, 100);
  }

  function formatSessionTime() {
    const now = new Date();

    return now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getTotalPracticeActions() {
    return (
      sessionStats.backUps +
      sessionStats.pullForwards +
      sessionStats.steeringCorrections
    );
  }

  async function savePracticeSession() {
    if (!hasLoadedPracticeHistory) return;
    if (hasSavedCurrentSessionRef.current) return;
    if (getTotalPracticeActions() === 0) return;

    const newSession: PracticeSession = {
      id: `${Date.now()}`,
      completedAt: formatSessionTime(),
      scenario,
      backingSide,
      score: calculateTrainingScore(),
      stats: { ...sessionStats },
    };

    const nextSessions = [newSession, ...practiceSessions].slice(0, 5);

    setPracticeSessions(nextSessions);
    hasSavedCurrentSessionRef.current = true;

    try {
      await AsyncStorage.setItem(
        PRACTICE_HISTORY_STORAGE_KEY,
        JSON.stringify(nextSessions),
      );
    } catch (error) {
      console.warn("Failed to save practice history", error);
    }
  }
  function getScenarioPhysicsMultiplier() {
    if (scenario === "easy") return 0.75;
    if (scenario === "tight") return 1.25;
    return 1;
  }

  function getJackknifeLimit() {
    if (scenario === "easy") return 42;
    if (scenario === "tight") return 32;
    return 36;
  }

  function isJackknifeAutoStop(trailerAngleValue: number) {
    const autoStopLimit =
      scenario === "easy" ? 36 : scenario === "tight" ? 26 : 30;

    return Math.abs(trailerAngleValue) >= autoStopLimit;
  }

  function calculateTrailerChangeWhileBacking({
    steeringAngle,
    trailerAngle,
  }: {
    steeringAngle: number;
    trailerAngle: number;
  }) {
    const physicsMultiplier = getScenarioPhysicsMultiplier();

    const steeringInfluence = steeringAngle * -0.12;
    const trailerMomentum = trailerAngle * 0.06;

    return (steeringInfluence + trailerMomentum) * physicsMultiplier;
  }

  function incrementSessionStat(key: keyof SessionStats) {
    setSessionStats((current) => ({
      ...current,
      [key]: current[key] + 1,
    }));
  }

  function resetSessionStats() {
    setSessionStats({
      backUps: 0,
      pullForwards: 0,
      steeringCorrections: 0,
      autoStops: 0,
      recoveryCompletions: 0,
    });
  }

  function resetSafetyFlags() {
    hasSpokenAutoStopRef.current = false;
    hasSpokenRecoveryCompleteRef.current = false;
    hasSpokenResumeBackingRef.current = false;
    hasCountedRecoveryCompleteRef.current = false;
    hasCountedAutoStopRef.current = false;
    setLastVoiceMessage(null);
  }

  function resetSimulation() {
    setSimulatedSteeringAngle(steeringAngle);
    setSimulatedTruckAngle(truckAngle);
    setSimulatedTrailerAngle(trailerAngle);
    setPracticeAction("idle");
    setMovementTrail([]);
    setIsRecoveringFromJackknife(false);
    setHasStartedPractice(false);
    resetSafetyFlags();
    resetSessionStats();
    hasSavedCurrentSessionRef.current = false;
  }

  function startNewSession() {
    setSimulatedSteeringAngle(steeringAngle);
    setSimulatedTruckAngle(truckAngle);
    setSimulatedTrailerAngle(trailerAngle);
    setPracticeAction("idle");
    setHasStartedPractice(false);
    setMovementTrail([]);
    setIsRecoveringFromJackknife(false);

    hasSavedCurrentSessionRef.current = false;

    resetSafetyFlags();
    resetSessionStats();
  }
  const jackknifeAutoStopActive = isJackknifeAutoStop(simulatedTrailerAngle);

  useEffect(() => {
    if (jackknifeAutoStopActive) {
      setIsRecoveringFromJackknife(true);

      if (!hasCountedAutoStopRef.current) {
        hasCountedAutoStopRef.current = true;
        incrementSessionStat("autoStops");
      }
    }

    if (!jackknifeAutoStopActive) {
      hasCountedAutoStopRef.current = false;
    }
  }, [jackknifeAutoStopActive]);
  const recoveryComplete =
    isRecoveringFromJackknife &&
    !jackknifeAutoStopActive &&
    Math.abs(simulatedTrailerAngle) < 12;

  const showResumeBackingCoaching = recoveryComplete;
  const resumeBackingMessage =
    "Resume backing slowly. Straighten the wheel, check both mirrors, and use small steering corrections.";

  function speakSafetyMessage(message: string) {
    setLastVoiceMessage(message);

    if (!voiceEnabled) return;

    Speech.stop();
    Speech.speak(message, {
      language: "en-US",
      rate: 0.9,
      pitch: 1.0,
    });
  }

  function repeatLastSafetyMessage() {
    if (!lastVoiceMessage) return;

    if (!voiceEnabled) {
      setVoiceEnabled(true);
    }

    Speech.stop();
    Speech.speak(lastVoiceMessage, {
      language: "en-US",
      rate: 0.9,
      pitch: 1.0,
    });
  }

  useEffect(() => {
    if (recoveryComplete && !hasCountedRecoveryCompleteRef.current) {
      hasCountedRecoveryCompleteRef.current = true;
      incrementSessionStat("recoveryCompletions");
    }

    if (!isRecoveringFromJackknife) {
      hasCountedRecoveryCompleteRef.current = false;
    }
  }, [recoveryComplete, isRecoveringFromJackknife]);

  // useEffect(() => {
  //   setShowControlPad(false);
  //   setPracticeFinished(false);
  // }, [stepIndex]);

  useEffect(() => {
    let mounted = true;

    async function loadRigSettings() {
      try {
        const savedSettings = await AsyncStorage.getItem(
          RIG_SETTINGS_STORAGE_KEY,
        );

        if (!mounted || !savedSettings) return;

        const parsed = JSON.parse(savedSettings) as Partial<SavedRigSettings>;

        if (parsed.backingSide === "left" || parsed.backingSide === "right") {
          setBackingSide(parsed.backingSide);
        }

        if (
          parsed.scenario === "easy" ||
          parsed.scenario === "normal" ||
          parsed.scenario === "tight"
        ) {
          setScenario(parsed.scenario);
        }
      } catch (error) {
        console.warn("Failed to load rig settings", error);
      }
    }

    loadRigSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPracticeHistory() {
      try {
        const savedHistory = await AsyncStorage.getItem(
          PRACTICE_HISTORY_STORAGE_KEY,
        );

        if (!mounted) return;

        if (!savedHistory) {
          setHasLoadedPracticeHistory(true);
          return;
        }

        const parsed = JSON.parse(savedHistory) as PracticeSession[];

        if (Array.isArray(parsed)) {
          setPracticeSessions(parsed.slice(0, 5));
        }
      } catch (error) {
        console.warn("Failed to load practice history", error);
      } finally {
        if (mounted) {
          setHasLoadedPracticeHistory(true);
        }
      }
    }

    loadPracticeHistory();

    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (stepIndex === totalSteps - 1 && hasLoadedPracticeHistory) {
      savePracticeSession();
    }
  }, [
    stepIndex,
    totalSteps,
    hasLoadedPracticeHistory,
    sessionStats,
    practiceSessions,
    scenario,
    backingSide,
  ]);
  async function clearPracticeHistory() {
    setPracticeSessions([]);
    hasSavedCurrentSessionRef.current = false;

    try {
      await AsyncStorage.removeItem(PRACTICE_HISTORY_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear practice history", error);
    }
  }
  useEffect(() => {
    if (jackknifeAutoStopActive && !hasSpokenAutoStopRef.current) {
      hasSpokenAutoStopRef.current = true;
      hasSpokenRecoveryCompleteRef.current = false;
      hasSpokenResumeBackingRef.current = false;

      speakSafetyMessage(
        "Stop. Jackknife prevention active. Pull forward slowly to straighten the trailer.",
      );
    }

    if (recoveryComplete && !hasSpokenRecoveryCompleteRef.current) {
      hasSpokenRecoveryCompleteRef.current = true;

      speakSafetyMessage("Recovery complete. Trailer angle is safe again.");
    }

    if (showResumeBackingCoaching && !hasSpokenResumeBackingRef.current) {
      hasSpokenResumeBackingRef.current = true;

      const timeoutId = setTimeout(() => {
        speakSafetyMessage(resumeBackingMessage);
      }, 1600);

      return () => clearTimeout(timeoutId);
    }
  }, [
    jackknifeAutoStopActive,
    recoveryComplete,
    showResumeBackingCoaching,
    resumeBackingMessage,
    voiceEnabled,
  ]);
  useEffect(() => {
    if (!voiceEnabled) {
      Speech.stop();
      return;
    }

    Speech.stop();
    Speech.speak(voicePrompt, {
      language: "en-US",
      rate: 0.9,
      pitch: 1.0,
    });

    return () => {
      Speech.stop();
    };
  }, [voicePrompt, voiceEnabled]);

  useEffect(() => {
    setSimulatedSteeringAngle(steeringAngle);
    setSimulatedTruckAngle(truckAngle);
    setSimulatedTrailerAngle(trailerAngle);
    setPracticeAction("idle");
    setHasStartedPractice(false);
    setIsRecoveringFromJackknife(false);
    setMovementTrail([]);
    resetSafetyFlags();
  }, [stepIndex, backingSide, steeringAngle, truckAngle, trailerAngle]);

  function handlePracticeAction(action: PracticeAction) {
    setPracticeAction(action);

    if (action !== "stop") {
      setHasStartedPractice(true);

      // A new practice action means this is a new active session,
      // so allow it to be saved again when the user reaches the final step.
      hasSavedCurrentSessionRef.current = false;
    }

    const jackknifeLimit = getJackknifeLimit();

    if (action === "steerLeft") {
      incrementSessionStat("steeringCorrections");

      setSimulatedSteeringAngle((current) => clamp(current - 10, -45, 45));
      setSimulatedTruckAngle((current) => clamp(current - 3, -25, 25));
      return;
    }

    if (action === "steerRight") {
      incrementSessionStat("steeringCorrections");

      setSimulatedSteeringAngle((current) => clamp(current + 10, -45, 45));
      setSimulatedTruckAngle((current) => clamp(current + 3, -25, 25));
      return;
    }

    if (action === "backing") {
      incrementSessionStat("backUps");

      if (isJackknifeAutoStop(simulatedTrailerAngle)) {
        setPracticeAction("stop");
        setIsRecoveringFromJackknife(true);
        return;
      }

      if (isRecoveringFromJackknife && Math.abs(simulatedTrailerAngle) < 12) {
        setIsRecoveringFromJackknife(false);
        hasSpokenRecoveryCompleteRef.current = false;
        hasSpokenResumeBackingRef.current = false;
        hasCountedRecoveryCompleteRef.current = false;
      }

      setSimulatedTruckAngle((currentTruckAngle) => {
        const steeringEffect = simulatedSteeringAngle * 0.08;
        const nextTruckAngle =
          moveTowardZero(currentTruckAngle, 1.5) + steeringEffect;

        return clamp(nextTruckAngle, -25, 25);
      });

      setSimulatedTrailerAngle((currentTrailerAngle) => {
        const trailerChange = calculateTrailerChangeWhileBacking({
          steeringAngle: simulatedSteeringAngle,
          trailerAngle: currentTrailerAngle,
        });

        return clamp(
          currentTrailerAngle + trailerChange,
          -jackknifeLimit,
          jackknifeLimit,
        );
      });

      setMovementTrail((current) => {
        const nextIndex = current.length;

        const trailerCurveAmount = Math.min(
          Math.abs(simulatedTrailerAngle) * 0.9,
          32,
        );

        const leftSidePoint = {
          x: 190 - nextIndex * 12 - trailerCurveAmount,
          y: 160 - nextIndex * 5,
          angle: simulatedTrailerAngle,
        };

        const rightSidePoint = {
          x: 55 + nextIndex * 12 + trailerCurveAmount,
          y: 160 - nextIndex * 5,
          angle: simulatedTrailerAngle,
        };

        const nextPoint =
          backingSide === "left" ? leftSidePoint : rightSidePoint;

        return [...current.slice(-12), nextPoint];
      });

      return;
    }

    if (action === "forward") {
      incrementSessionStat("pullForwards");

      setSimulatedSteeringAngle((current) => moveTowardZero(current, 10));
      setSimulatedTruckAngle((current) => moveTowardZero(current, 8));
      setSimulatedTrailerAngle((current) => moveTowardZero(current, 10));
      return;
    }

    if (action === "stop") {
      return;
    }
  }
  const showRecoveryCoach =
    jackknifeAutoStopActive || isRecoveringFromJackknife || recoveryComplete;

  return (
    <View
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 16,
        backgroundColor: "#ecfeff",
        borderWidth: 1,
        borderColor: "#67e8f9",
      }}
    >
      {appMode === "practice" ? (
        <View
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 14,
            backgroundColor: "#f5f3ff",
            borderWidth: 2,
            borderColor: "#7c3aed",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: "#5b21b6",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Practice Simulator
          </Text>

          <Text
            style={{
              marginTop: 5,
              fontSize: 11,
              fontWeight: "800",
              color: "#5b21b6",
              textAlign: "center",
              lineHeight: 16,
            }}
          >
            Use these controls to learn steering, jackknife risk, and recovery.
            Not for real backing movement.
          </Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 12, fontWeight: "bold", color: "#0e7490" }}>
        STEP {stepIndex + 1} OF {totalSteps}
      </Text>

      <View
        style={{
          marginTop: 12,
          backgroundColor: bannerColor,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 10,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 16,
            fontWeight: "900",
          }}
        >
          {steeringGuidance}
        </Text>
      </View>

      <View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            onPress={goBack}
            disabled={stepIndex === 0}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ccc",
              backgroundColor: stepIndex === 0 ? "#f1f5f9" : "white",
              opacity: stepIndex === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "bold" }}>
              Back
            </Text>
          </TouchableOpacity>

          {stepIndex === totalSteps - 1 ? (
            <TouchableOpacity
              onPress={() => {
                restartPractice();
                resetSimulation();
              }}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: "#16a34a",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                🔄 Restart
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={goNext}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                backgroundColor: "#0891b2",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                Next
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {appMode === "practice" ? (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              {(["easy", "normal", "tight"] as const).map((item) => {
                const selected = scenario === item;

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setScenario(item);
                      saveRigSettings({ backingSide, scenario: item });
                      setMovementTrail([]);
                      setIsRecoveringFromJackknife(false);
                      resetSafetyFlags();
                    }}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: selected ? "#7c3aed" : "white",
                      borderWidth: 1,
                      borderColor: selected ? "#7c3aed" : "#cbd5e1",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "900",
                        color: selected ? "white" : "#0f172a",
                        fontSize: 12,
                      }}
                    >
                      {item === "easy"
                        ? "Easy"
                        : item === "normal"
                          ? "Normal"
                          : "Tight"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text
              style={{
                marginTop: 8,
                textAlign: "center",
                color:
                  scenario === "tight"
                    ? "#dc2626"
                    : scenario === "easy"
                      ? "#16a34a"
                      : "#475569",
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {scenario === "easy"
                ? "Wide practice site — forgiving setup"
                : scenario === "tight"
                  ? "Tight site — use smaller steering corrections"
                  : "Normal practice site"}
            </Text>
          </>
        ) : null}
        {appMode === "practice" ? (
          <SteeringWheel
            steeringAngle={displaySteeringAngle}
            label={steeringLabel}
          />
        ) : null}{" "}
        {appMode === "practice" ? (
          <CompactRigStatusRow
            steeringAngle={displaySteeringAngle}
            truckAngle={simulatedTruckAngle}
            trailerAngle={simulatedTrailerAngle}
            scenario={scenario}
          />
        ) : null}
        {appMode === "practice" ? (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => {
                Speech.stop();
                setVoiceEnabled((current) => !current);
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: voiceEnabled ? "#0f172a" : "#64748b",
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                {voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Speech.stop();
                Speech.speak(voicePrompt, {
                  language: "en-US",
                  rate: 0.9,
                  pitch: 1.0,
                });
              }}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#0f172a",
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "900",
                  fontSize: 12,
                }}
              >
                🔁 Repeat
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <Text
          style={{
            marginTop: 12,
            fontSize: 14,
            fontWeight: "bold",
            color: "#0f172a",
          }}
        >
          {currentStep.title}
        </Text>
        <Text style={{ marginTop: 10, fontSize: 12, lineHeight: 15 }}>
          {currentStep.instruction}
        </Text>
        {currentStep.warning ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "#fff7ed",
              borderWidth: 1,
              borderColor: "#fed7aa",
            }}
          >
            <Text style={{ color: "#9a3412", fontWeight: "bold" }}>
              ⚠️ {currentStep.warning}
            </Text>
          </View>
        ) : null}
        <ParkingDiagram
          stepIndex={stepIndex}
          backingSide={backingSide}
          campsiteType={campsiteType}
          simulatedTruckAngle={simulatedTruckAngle}
          simulatedTrailerAngle={simulatedTrailerAngle}
          movementTrail={movementTrail}
          obstacles={obstacles}
          parkingType={parkingType}
        />
        {appMode === "practice" ? (
          <PracticeModeControls
            practiceAction={practiceAction}
            onPracticeAction={handlePracticeAction}
            onResetSimulation={resetSimulation}
            backingSide={backingSide}
          />
        ) : null}
        {hasAnyClearanceValue ? (
          <DistanceWarningSummaryCard
            clearanceItems={clearanceItems}
            compact={true}
            showVoiceButton={false}
            distanceSource={distanceSource}
          />
        ) : null}
        <GetOutAndLookCard
          parkingType={parkingType}
          stepIndex={stepIndex}
          obstacles={obstacles}
        />
        {/* <SmartNextMoveCard
          stepIndex={stepIndex}
          backingSide={backingSide}
          campsiteType={campsiteType}
          obstacles={obstacles}
          scenario={scenario}
          voiceEnabled={voiceEnabled}
          parkingType={parkingType}
          clearanceValues={clearanceValues}
          distanceSource={distanceSource}
          stopRecoveryConfirmed={stopRecoveryConfirmed}
        /> */}
        {showRecoveryCoach ? (
          <RecoveryCoachCard
            backingSide={backingSide}
            obstacles={obstacles}
            voiceEnabled={voiceEnabled}
            campsiteType={campsiteType}
          />
        ) : null}
        {jackknifeAutoStopActive ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "#fee2e2",
              borderWidth: 1,
              borderColor: "#ef4444",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#991b1b",
                textAlign: "center",
              }}
            >
              🛑 Jackknife Prevention Auto Stop
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "700",
                color: "#7f1d1d",
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Trailer angle is too sharp. Stop backing and pull forward to
              straighten the rig.
            </Text>
          </View>
        ) : null}
        {recoveryComplete ? (
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "#dcfce7",
              borderWidth: 1,
              borderColor: "#22c55e",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#14532d",
                textAlign: "center",
              }}
            >
              ✅ Recovery Complete
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "700",
                color: "#14532d",
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Trailer angle is safe again. Straighten the wheel, check both
              mirrors, and resume backing slowly.
            </Text>
          </View>
        ) : null}
        {showResumeBackingCoaching ? (
          <View
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 14,
              backgroundColor: "#e0f2fe",
              borderWidth: 1,
              borderColor: "#38bdf8",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "900",
                color: "#075985",
                textAlign: "center",
              }}
            >
              🔁 Resume Backing Slowly
            </Text>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: "700",
                color: "#075985",
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Trailer angle is safe again. Straighten the wheel, check both
              mirrors, and back up slowly with small steering corrections.
            </Text>

            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "#bae6fd",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  color: "#0f172a",
                  textAlign: "center",
                  lineHeight: 17,
                }}
              >
                Next action: tap Back up only after the steering wheel is close
                to straight.
              </Text>
            </View>
          </View>
        ) : null}
        {lastVoiceMessage ? (
          <View
            style={{
              marginTop: 10,
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
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Last Voice Coaching
            </Text>

            <Text
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: "700",
                color: "#0f172a",
                lineHeight: 18,
              }}
            >
              {lastVoiceMessage}
            </Text>

            <TouchableOpacity
              onPress={repeatLastSafetyMessage}
              style={{
                marginTop: 10,
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: "#0f172a",
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
                🔁 Repeat Safety Coaching
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}
