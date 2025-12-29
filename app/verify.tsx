import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useAlarmStore } from "../scripts/alarmStore";
import CameraPreview from "../components/CameraPreview";
import { useBlockBack } from "../scripts/useBlockBack";


export default function VerifyScreen() {
    useBlockBack(true);
    const {
        status,
        exercise,
        reps,
        targetReps,
        incrementRep,
        resetReps,
        stop,
    } = useAlarmStore();

    useEffect(() => {
    if (status !== "RINGING") {
        router.replace("/");
    }
    }, [status]);

    const done = useMemo(() => reps >= targetReps, [reps, targetReps]);

    const complete = () => {
    stop(); 
    router.replace("/");
    };

    return (
    <View style={styles.container}>
        <CameraPreview />

        {/* Overlay UI */}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.hud}>
            <Text style={styles.hudText}>
            Do {targetReps} {exercise}
            </Text>
            <Text style={styles.hudTextBig}>
            {reps} / {targetReps}
            </Text>
        </View>

        <View style={styles.controls}>
            <Pressable
            style={[styles.button, done && styles.buttonDisabled]}
            onPress={() => incrementRep(1)} // ML should deal with incrementing later
            disabled={done}
            >
            <Text style={styles.buttonText}>+1 Rep (mock)</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={resetReps}>
            <Text style={styles.buttonText}>Reset reps</Text>
            </Pressable>

            <Pressable
            style={[styles.button, !done && styles.buttonDisabled]}
            onPress={complete}
            disabled={!done}
            >
            <Text style={styles.buttonText}>Stop Alarm</Text>
            </Pressable>

            <Pressable style={styles.link} onPress={() => router.replace("/alarm")}>
            <Text style={styles.linkText}>Back to alarm</Text>
            </Pressable>
        </View>
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "black" },
    hud: { paddingTop: 50, paddingHorizontal: 16 },
    hudText: { color: "white", fontSize: 14 },
    hudTextBig: { color: "white", fontSize: 28, fontWeight: "700", marginTop: 6 },
    controls: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    gap: 10,
    },
    button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    },
    buttonDisabled: { opacity: 0.45 },
    buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
    link: { alignItems: "center", paddingVertical: 8 },
    linkText: { color: "#cfcfcf" },
});
