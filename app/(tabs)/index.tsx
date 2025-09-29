import { auth } from "@/FirebaseConfig";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAuth } from "firebase/auth";
import { router } from "expo-router";

export default function HomeScreen() {
    getAuth().onAuthStateChanged((user) => {
        if (!user) {
           router.replace("/");
        } else {
            console.log("User is signed in");
        }
    });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.title}>Sign Out</Text>
      <TouchableOpacity onPress={() => auth.signOut()}
        >
        <Text style={styles.title}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>This is a placeholder home screen.</Text>
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


