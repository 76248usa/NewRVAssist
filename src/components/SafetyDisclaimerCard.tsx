import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function SafetyDisclaimerCard() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#fffaf5",
        borderWidth: 1,
        borderColor: "#fed7aa",
      }}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded((current) => !current)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
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
              color: "#9a3412",
              letterSpacing: 0.2,
            }}
          >
            Safety Reminder
          </Text>

          <Text
            style={{
              marginTop: 3,
              fontSize: 12,
              fontWeight: "500",
              color: "#7c2d12",
              lineHeight: 17,
            }}
          >
            Training aid only. Always confirm your surroundings.
          </Text>
        </View>

        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffedd5",
            borderWidth: 1,
            borderColor: "#fdba74",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#9a3412",
              textAlign: "center",
              lineHeight: 18,
              includeFontPadding: false,
              transform: [{ translateY: -1 }],
            }}
          >
            {isExpanded ? "−" : "+"}
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#fed7aa",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "400",
              color: "#7c2d12",
              lineHeight: 18,
            }}
          >
            RV Assist is a training aid only. Always use your mirrors, backup
            camera, spotter, and direct visual checks when backing an RV.
          </Text>

          <Text
            style={{
              marginTop: 7,
              fontSize: 12,
              fontWeight: "600",
              color: "#9a3412",
              lineHeight: 18,
            }}
          >
            Stop immediately if you are unsure about clearance, trailer angle,
            people, pets, or obstacles.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
