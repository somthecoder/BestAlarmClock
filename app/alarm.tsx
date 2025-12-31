// app/alarm.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Vibration } from "react-native";
import { router } from "expo-router";
import { useAlarmStore } from "../scripts/alarmStore";
import { useBlockBack } from "../scripts/useBlockBack";


export default function AlarmScreen() {
    useBlockBack(true);
    const { status, ring } = useAlarmStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        ring();
    }, [ring]);

    const goVerify = () => router.replace("/verify");


    const onStopPressed = async () => {
        setError("Stop is disabled until verified. Go verify.");
    };

    return (
        <View style={styles.container}>
          <Text style={styles.title}>ALARM</Text>
          <Text style={styles.subtitle}>Complete the exercise to stop it.</Text>
    
          <Pressable style={styles.primary} onPress={goVerify}>
            <Text style={styles.primaryText}>Go to Verification</Text>
          </Pressable>
    
          <Pressable style={styles.secondary} onPress={onStopPressed}>
            <Text style={styles.secondaryText}>Stop (disabled)</Text>
          </Pressable>
    
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.debug}>Status: {status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "white", fontSize: 36, fontWeight: "700", marginBottom: 10 },
  subtitle: { color: "#cfcfcf", fontSize: 16, marginBottom: 24, textAlign: "center" },
  primary: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, marginBottom: 12 },
  primaryText: { color: "white", fontSize: 16, fontWeight: "600" },
  secondary: { backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 },
  secondaryText: { color: "#cfcfcf", fontSize: 14 },
  error: { color: "#ff8080", marginTop: 16, textAlign: "center" },
  debug: { color: "#777", marginTop: 18, fontSize: 12 },
});