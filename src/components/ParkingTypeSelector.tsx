import { Text, TouchableOpacity, View } from "react-native";
import { ParkingType } from "../constants/parkingGuidance";

type Props = {
  parkingType: ParkingType;
  selectParkingType: (type: ParkingType) => void;
};

const parkingTypes: {
  label: string;
  value: ParkingType;
  emoji: string;
  description: string;
}[] = [
  {
    label: "Back-in",
    value: "back-in",
    emoji: "↩️",
    description: "Reverse into the site",
  },
  {
    label: "Pull-through",
    value: "pull-through",
    emoji: "➡️",
    description: "Drive forward through",
  },
];

export function ParkingTypeSelector({ parkingType, selectParkingType }: Props) {
  return (
    <View
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: "#334155",
          letterSpacing: 0.2,
          marginBottom: 9,
        }}
      >
        Parking type
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
        }}
      >
        {parkingTypes.map((type) => {
          const isSelected = parkingType === type.value;

          return (
            <TouchableOpacity
              key={type.value}
              onPress={() => selectParkingType(type.value)}
              activeOpacity={0.82}
              style={{
                flex: 1,
                minHeight: 86,
                paddingVertical: 10,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSelected ? "#f0fdfa" : "#f8fafc",
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? "#0f766e" : "#dbe3ef",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  marginBottom: 4,
                }}
              >
                {type.emoji}
              </Text>

              <Text
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: isSelected ? "700" : "600",
                  color: isSelected ? "#115e59" : "#334155",
                }}
              >
                {type.label}
              </Text>

              <Text
                style={{
                  marginTop: 3,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: "400",
                  color: isSelected ? "#0f766e" : "#64748b",
                  lineHeight: 14,
                }}
              >
                {type.description}
              </Text>

              {isSelected ? (
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
    </View>
  );
}
