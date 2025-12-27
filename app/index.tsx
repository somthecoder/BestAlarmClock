import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Link href="/camera" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Open Camera</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "black" },
  button: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  buttonText: { color: "white", fontSize: 16 },
});
