import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { PracticeHistoryCard, PracticeSession } from "./PracticeHistoryCard";
import { PracticeTipsCard } from "./PracticeTipsCard";
import { ProgressTrendCard } from "./ProgressTrendCard";
import { SessionStats, SessionStatsCard } from "./SessionStatsCard";
import { SessionSummaryCard } from "./SessionSummaryCard";
import { TrainingScoreCard } from "./TrainingScoreCard";

type Scenario = "easy" | "normal" | "tight";

type Props = {
  stepIndex: number;
  totalSteps: number;
  steeringAngle: number;
  truckAngle: number;
  trailerAngle: number;
  scenario: Scenario;
  backingSide: "left" | "right";
  sessionStats: SessionStats;
  practiceSessions: PracticeSession[];
  restartPractice: () => void;
  clearPracticeHistory: () => void;
  appMode: "parking" | "practice";
};

export function PracticeResultsSection({
  stepIndex,
  totalSteps,
  steeringAngle,
  truckAngle,
  trailerAngle,
  scenario,
  backingSide,
  sessionStats,
  practiceSessions,
  restartPractice,
  clearPracticeHistory,
  appMode,
}: Props) {
  const isFinalStep = stepIndex === totalSteps - 1;
  const [showResults, setShowResults] = useState(false);

  if (appMode !== "practice") {
    return null;
  }

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#cbd5e1",
      }}
    >
      {appMode === "practice" ? (
        <TouchableOpacity
          onPress={() => setShowResults((current) => !current)}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: showResults ? "#334155" : "#0f172a",
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontSize: 14,
              fontWeight: "900",
            }}
          >
            {showResults ? "Hide Practice Results" : "Show Practice Results"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {!showResults ? (
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: "700",
            color: "#64748b",
            textAlign: "center",
            lineHeight: 17,
          }}
        >
          Results, score, history, progress trend, and tips are hidden to give
          the simulator more screen space.
        </Text>
      ) : null}

      {appMode === "practice" && showResults ? (
        <View style={{ marginTop: 12 }}>
          <SessionStatsCard stats={sessionStats} />

          {isFinalStep ? (
            <>
              <TrainingScoreCard
                stepIndex={stepIndex}
                totalSteps={totalSteps}
                steeringAngle={steeringAngle}
                truckAngle={truckAngle}
                trailerAngle={trailerAngle}
                scenario={scenario}
                sessionStats={sessionStats}
              />

              <SessionSummaryCard
                scenario={scenario}
                backingSide={backingSide}
                sessionStats={sessionStats}
              />

              <TouchableOpacity
                onPress={restartPractice}
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: "#16a34a",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "900",
                    fontSize: 16,
                  }}
                >
                  🔄 Restart Practice
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          <PracticeHistoryCard sessions={practiceSessions} />

          {practiceSessions.length > 0 ? (
            <TouchableOpacity
              onPress={clearPracticeHistory}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "#dc2626",
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
                Clear Practice History
              </Text>
            </TouchableOpacity>
          ) : null}

          <ProgressTrendCard sessions={practiceSessions} />

          <PracticeTipsCard sessions={practiceSessions} />
        </View>
      ) : null}
    </View>
  );
}
