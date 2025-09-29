import { StyleSheet, Text, View } from "react-native";

export default function TwoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two</Text>
      <Text style={styles.subtitle}>This is the second placeholder tab.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
});


