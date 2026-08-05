import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type SiteObstacle =
  | "treeLeft"
  | "poleRight"
  | "lowBranch"
  | "tightHookupSide";

type ObstacleOption = {
  id: SiteObstacle;
  title: string;
  subtitle: string;
  emoji: string;
};

type Props = {
  obstacles: SiteObstacle[];
  setObstacles: (obstacles: SiteObstacle[]) => void;
};

const OBSTACLE_OPTIONS: ObstacleOption[] = [
  {
    id: "treeLeft",
    title: "Tree left",
    subtitle: "Watch the left mirror",
    emoji: "🌳",
  },
  {
    id: "poleRight",
    title: "Pole right",
    subtitle: "Watch the right mirror",
    emoji: "🚧",
  },
  {
    id: "lowBranch",
    title: "Low branch",
    subtitle: "Check roof clearance",
    emoji: "🌿",
  },
  {
    id: "tightHookupSide",
    title: "Hookup side",
    subtitle: "Leave room for hookups",
    emoji: "⚡",
  },
];

function getSelectedObstacleLabels(obstacles: SiteObstacle[]) {
  if (obstacles.length === 0) {
    return "No obstacles selected";
  }

  const labels: string[] = [];

  if (obstacles.includes("treeLeft")) labels.push("Tree left");
  if (obstacles.includes("poleRight")) labels.push("Pole right");
  if (obstacles.includes("lowBranch")) labels.push("Low branch");
  if (obstacles.includes("tightHookupSide")) labels.push("Hookup side");

  return labels.join(" • ");
}

function getObstacleCoaching(obstacles: SiteObstacle[]) {
  if (obstacles.length === 0) {
    return "No specific obstacles selected. Still check both mirrors, the roof, the rear of the trailer, and both sides before backing.";
  }

  const coaching: string[] = [];

  if (obstacles.includes("poleRight")) {
    coaching.push(
      "Keep extra clearance on the right and check the right mirror often.",
    );
  }

  if (obstacles.includes("treeLeft")) {
    coaching.push(
      "Keep the trailer angle shallow and check the left mirror often.",
    );
  }

  if (obstacles.includes("lowBranch")) {
    coaching.push("Confirm roof and A/C clearance before backing farther.");
  }

  if (obstacles.includes("tightHookupSide")) {
    coaching.push("Leave enough room for hookups, slides, and walking space.");
  }

  return coaching.join(" ");
}

export function SiteObstacleSelector({ obstacles, setObstacles }: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggleObstacle(obstacle: SiteObstacle) {
    const alreadySelected = obstacles.includes(obstacle);

    if (alreadySelected) {
      setObstacles(obstacles.filter((item) => item !== obstacle));
      return;
    }

    setObstacles([...obstacles, obstacle]);
  }

  function clearObstacles() {
    setObstacles([]);
  }

  const selectedLabels = getSelectedObstacleLabels(obstacles);
  const obstacleCoaching = getObstacleCoaching(obstacles);

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
        onPress={() => setExpanded((current) => !current)}
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
            Site obstacles
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
            {obstacles.length === 0
              ? "No obstacles selected"
              : `${obstacles.length} ${
                  obstacles.length === 1 ? "obstacle" : "obstacles"
                } selected`}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: "400",
              color: obstacles.length > 0 ? "#92400e" : "#64748b",
              lineHeight: 16,
            }}
          >
            {selectedLabels}
          </Text>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: expanded ? "#ffedd5" : "#eef2f7",
            borderWidth: 1,
            borderColor: expanded ? "#fdba74" : "#cbd5e1",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: expanded ? "#9a3412" : "#475569",
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

      {expanded ? (
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 12,
          }}
        >
          <View
            style={{
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "400",
                color: "#64748b",
                lineHeight: 16,
              }}
            >
              Select anything near the site that could affect the backing path.
              More than one obstacle may be selected.
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              {OBSTACLE_OPTIONS.map((option) => {
                const selected = obstacles.includes(option.id);

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => toggleObstacle(option.id)}
                    activeOpacity={0.82}
                    style={{
                      width: "48%",
                      minHeight: 104,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected ? "#fff7ed" : "#ffffff",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#c2410c" : "#dbe3ef",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 19,
                      }}
                    >
                      {option.emoji}
                    </Text>

                    <Text
                      style={{
                        marginTop: 4,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: selected ? "700" : "600",
                        color: selected ? "#9a3412" : "#334155",
                        lineHeight: 16,
                      }}
                    >
                      {option.title}
                    </Text>

                    <Text
                      style={{
                        marginTop: 3,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: "400",
                        color: selected ? "#c2410c" : "#64748b",
                        lineHeight: 14,
                      }}
                    >
                      {option.subtitle}
                    </Text>

                    {selected ? (
                      <View
                        style={{
                          marginTop: 6,
                          paddingVertical: 2,
                          paddingHorizontal: 7,
                          borderRadius: 999,
                          backgroundColor: "#ffedd5",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "600",
                            color: "#9a3412",
                          }}
                        >
                          Selected
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            {obstacles.length > 0 ? (
              <TouchableOpacity
                onPress={clearObstacles}
                activeOpacity={0.82}
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 11,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#fecaca",
                }}
              >
                <Text
                  style={{
                    color: "#b91c1c",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "400",
                  }}
                >
                  Clear selected obstacles
                </Text>
              </TouchableOpacity>
            ) : null}

            <View
              style={{
                marginTop: 10,
                padding: 11,
                borderRadius: 12,
                backgroundColor: obstacles.length > 0 ? "#fffaf5" : "#f8fafc",
                borderWidth: 1,
                borderColor: obstacles.length > 0 ? "#fed7aa" : "#e2e8f0",
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
                    width: 24,
                    height: 24,
                    marginRight: 8,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      obstacles.length > 0 ? "#ffedd5" : "#eef2f7",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 12,
                      lineHeight: 14,
                      includeFontPadding: false,
                    }}
                  >
                    {obstacles.length > 0 ? "⚠️" : "✓"}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "500",
                      color: obstacles.length > 0 ? "#9a3412" : "#475569",
                      letterSpacing: 0.1,
                    }}
                  >
                    {obstacles.length > 0
                      ? "Obstacle coaching"
                      : "General clearance reminder"}
                  </Text>
                  <Text
                    style={{
                      marginTop: 3,
                      fontSize: 10,
                      fontWeight: "400",
                      color: obstacles.length > 0 ? "#c2410c" : "#64748b",
                      lineHeight: 14,
                    }}
                  >
                    {obstacles.length > 0
                      ? `${obstacles.length} ${
                          obstacles.length === 1 ? "obstacle" : "obstacles"
                        } selected`
                      : "No specific obstacles selected"}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: "400",
                  color: obstacles.length > 0 ? "#7c2d12" : "#475569",
                  lineHeight: 18,
                }}
              >
                {obstacleCoaching}
              </Text>

              {obstacles.length > 0 ? (
                <Text
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    fontWeight: "400",
                    color: "#9a3412",
                    lineHeight: 16,
                  }}
                >
                  Stop and get out to look whenever clearance is uncertain.
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
