import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type CampsiteType =
  | "straightBackIn"
  | "angledSite"
  | "tightCampgroundRoad"
  | "narrowDriveway";

type CampsiteOption = {
  id: CampsiteType;
  title: string;
  subtitle: string;
  emoji: string;
};

type Props = {
  campsiteType: CampsiteType;
  setCampsiteType: (type: CampsiteType) => void;
};

const CAMPSITE_OPTIONS: CampsiteOption[] = [
  {
    id: "straightBackIn",
    title: "Straight back-in",
    subtitle: "Normal campsite setup",
    emoji: "⬅️",
  },
  {
    id: "angledSite",
    title: "Angled campsite",
    subtitle: "Site entrance is angled",
    emoji: "↩️",
  },
  {
    id: "tightCampgroundRoad",
    title: "Tight road",
    subtitle: "Limited room to swing",
    emoji: "🚧",
  },
  {
    id: "narrowDriveway",
    title: "Narrow driveway",
    subtitle: "Tight entrance or home driveway",
    emoji: "🏠",
  },
];

function getSelectedOption(campsiteType: CampsiteType) {
  return (
    CAMPSITE_OPTIONS.find((option) => option.id === campsiteType) ??
    CAMPSITE_OPTIONS[0]
  );
}

function getCampsiteCoaching(type: CampsiteType) {
  if (type === "straightBackIn") {
    return "Use a normal setup beside the site. Back slowly, let the trailer start turning, then follow it into the space.";
  }

  if (type === "angledSite") {
    return "Let the trailer follow the angle of the campsite. Avoid turning too sharply at the beginning.";
  }

  if (type === "tightCampgroundRoad") {
    return "Use smaller steering corrections. Pull forward earlier if the trailer angle gets sharp or the truck runs out of room.";
  }

  return "Keep the rig as straight as possible before backing. Use very small corrections and stop often to check clearance.";
}

export function CampsiteSetupCard({ campsiteType, setCampsiteType }: Props) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = getSelectedOption(campsiteType);

  function chooseCampsiteType(type: CampsiteType) {
    setCampsiteType(type);
    setExpanded(false);
  }

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
            Campsite setup
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
            {selectedOption.emoji} {selectedOption.title}
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
            {selectedOption.subtitle}
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
              Choose the situation that best matches the parking area.
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 10,
              }}
            >
              {CAMPSITE_OPTIONS.map((option) => {
                const selected = campsiteType === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => chooseCampsiteType(option.id)}
                    activeOpacity={0.82}
                    style={{
                      width: "48%",
                      minHeight: 104,
                      paddingVertical: 10,
                      paddingHorizontal: 8,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected ? "#f0fdfa" : "#ffffff",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#0f766e" : "#dbe3ef",
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
                        color: selected ? "#115e59" : "#334155",
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
                        color: selected ? "#0f766e" : "#64748b",
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
                          backgroundColor: "#ccfbf1",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "600",
                            color: "#115e59",
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

            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                backgroundColor: "#eff6ff",
                borderWidth: 1,
                borderColor: "#bfdbfe",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#1d4ed8",
                  letterSpacing: 0.2,
                }}
              >
                Setup coaching
              </Text>

              <Text
                style={{
                  marginTop: 5,
                  fontSize: 12,
                  fontWeight: "400",
                  color: "#1e3a8a",
                  lineHeight: 18,
                }}
              >
                {getCampsiteCoaching(campsiteType)}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
