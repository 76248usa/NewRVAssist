import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ParkingType } from "../constants/parkingGuidance";
import { SiteObstacle } from "./SiteObstacleSelector";

type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
};

type Props = {
  parkingType: ParkingType;
  obstacles: SiteObstacle[];
};

function getChecklistItems(
  parkingType: ParkingType,
  obstacles: SiteObstacle[],
): ChecklistItem[] {
  const items: ChecklistItem[] = [
    {
      id: "mirrors",
      label: "Mirrors adjusted",
      detail: "Both mirrors give a clear view of the trailer sides.",
    },
    {
      id: "path",
      label:
        parkingType === "pull-through"
          ? "Pull-through path checked"
          : "Campsite entrance checked",
      detail:
        parkingType === "pull-through"
          ? "Entry path, exit path, and trailer swing are clear."
          : "Entrance, road edge, and trailer path are clear.",
    },
    {
      id: "goal",
      label: "Get out and look completed",
      detail: "You checked the site from outside the truck before moving.",
    },
    {
      id: "clearance",
      label: "Roof and rear clearance checked",
      detail: "A/C, roof, ladder, rear bumper, and nearby trees are clear.",
    },
  ];

  if (obstacles.length > 0) {
    items.push({
      id: "obstacles",
      label: "Selected obstacles checked",
      detail: "Poles, trees, branches, hookups, and tight areas were reviewed.",
    });
  }

  items.push({
    id: "spotter",
    label: "Spotter plan agreed, if available",
    detail: "Use clear hand signals or phone communication before moving.",
  });

  return items;
}

export function ReadyToBackChecklistCard({ parkingType, obstacles }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const checklistItems = getChecklistItems(parkingType, obstacles);
  const checkedCount = checkedItems.length;
  const totalCount = checklistItems.length;
  const isComplete = checkedCount === totalCount;

  function toggleChecked(itemId: string) {
    if (checkedItems.includes(itemId)) {
      setCheckedItems(checkedItems.filter((id) => id !== itemId));
      return;
    }

    setCheckedItems([...checkedItems, itemId]);
  }

  function resetChecklist() {
    setCheckedItems([]);
  }

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        backgroundColor: isComplete ? "#f0fdf4" : "#f8fafc",
        borderWidth: 1,
        borderColor: isComplete ? "#86efac" : "#dbe3ef",
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
              color: isComplete ? "#166534" : "#334155",
              letterSpacing: 0.2,
            }}
          >
            Ready to back
          </Text>

          <Text
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: "600",
              color: isComplete ? "#14532d" : "#0f172a",
              lineHeight: 18,
            }}
          >
            {isComplete
              ? "Safety checks complete"
              : `${checkedCount} of ${totalCount} checks complete`}
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 11,
              fontWeight: "400",
              color: isComplete ? "#166534" : "#64748b",
              lineHeight: 16,
            }}
          >
            {isComplete
              ? "Move slowly and stop if the situation changes."
              : "Review each item before moving the RV."}
          </Text>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isComplete
              ? "#dcfce7"
              : expanded
                ? "#e0f2fe"
                : "#eef2f7",
            borderWidth: 1,
            borderColor: isComplete
              ? "#86efac"
              : expanded
                ? "#38bdf8"
                : "#cbd5e1",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: isComplete ? "#166534" : expanded ? "#075985" : "#475569",
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
              borderTopColor: isComplete ? "#bbf7d0" : "#e2e8f0",
            }}
          >
            {checklistItems.map((item, index) => {
              const checked = checkedItems.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleChecked(item.id)}
                  activeOpacity={0.82}
                  style={{
                    marginTop: index === 0 ? 0 : 8,
                    padding: 10,
                    borderRadius: 12,
                    backgroundColor: checked ? "#f0fdf4" : "#ffffff",
                    borderWidth: 1,
                    borderColor: checked ? "#86efac" : "#e2e8f0",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        marginRight: 9,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: checked ? "#dcfce7" : "#f8fafc",
                        borderWidth: 1,
                        borderColor: checked ? "#4ade80" : "#cbd5e1",
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: checked ? "#15803d" : "#94a3b8",
                          lineHeight: 16,
                          includeFontPadding: false,
                        }}
                      >
                        {checked ? "✓" : ""}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: checked ? "600" : "500",
                          color: checked ? "#166534" : "#0f172a",
                          lineHeight: 17,
                        }}
                      >
                        {item.label}
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
                        {item.detail}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {isComplete ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: "#dcfce7",
                  borderWidth: 1,
                  borderColor: "#86efac",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#166534",
                  }}
                >
                  ✓ Ready to move slowly
                </Text>

                <Text
                  style={{
                    marginTop: 4,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "400",
                    color: "#166534",
                    lineHeight: 16,
                  }}
                >
                  Continue checking mirrors, clearances, people, and obstacles
                  while moving.
                </Text>
              </View>
            ) : null}

            {checkedCount > 0 ? (
              <TouchableOpacity
                onPress={resetChecklist}
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
                    fontWeight: "600",
                  }}
                >
                  Reset checklist
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
