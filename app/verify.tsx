// app/verify.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useAlarmStore } from "../scripts/alarmStore";
import CameraPreview from "../components/CameraPreview";
import { useBlockBack } from "../scripts/useBlockBack";
import { updatePushupRepCounter, type PushupState } from "../scripts/repCounter"


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

    const pushupStateRef = useRef<PushupState>("UP");
    const lastRepAtRef = useRef<number>(0);
    const [debugAngle, setDebugAngle] = useState<number>(NaN);
    const [debugSide, setDebugSide] = useState<string>("none");

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

    const stableDownRef = useRef(0);
    const stableUpRef = useRef(0);

    const emaAngleRef = useRef<number | null>(null);

    const EMA_ALPHA = 0.25; // higher = more responsive, lower = smoother

    function smoothAngle(raw: number) {
        if (!Number.isFinite(raw)) return emaAngleRef.current ?? NaN; // keep last
        const prev = emaAngleRef.current;
        const next = prev == null ? raw : prev + EMA_ALPHA * (raw - prev);
        emaAngleRef.current = next;
        return next;
    }

    return (
    <View style={styles.container}>
        <CameraPreview targetFps={15}
        onPose={(kps) => {
            if (exercise !== "pushups") return;

            const { elbowAngle, side, quality } =
            updatePushupRepCounter(kps, pushupStateRef.current);

            // Smooth (holds last good value when raw is NaN)
            const smoothed = smoothAngle(elbowAngle);

            setDebugSide(`${side} q=${quality.toFixed(2)}`);
            setDebugAngle(Number(smoothed));

            // If we still don't have an angle, bail
            if (!Number.isFinite(smoothed)) return;

            // Frame-stability gating (prevents flicker)
            const DOWN_ANGLE = 110;
            const UP_ANGLE = 150;

            if (pushupStateRef.current === "UP") {
            if (smoothed < DOWN_ANGLE) stableDownRef.current += 1;
            else stableDownRef.current = 0;

            // require 2 consecutive "down-ish" frames
            if (stableDownRef.current >= 2) {
                pushupStateRef.current = "DOWN";
                stableDownRef.current = 0;
            }
            } else {
                if (smoothed > UP_ANGLE) stableUpRef.current += 1;
                else stableUpRef.current = 0;

                // require 2 consecutive "up-ish" frames
                if (stableUpRef.current >= 2) {
                    pushupStateRef.current = "UP";
                    stableUpRef.current = 0;

                    const now = Date.now();
                    if (now - lastRepAtRef.current > 900) {
                    lastRepAtRef.current = now;
                    incrementRep(1);
                    }
                }
            }
        }}
        />

        {/* Overlay UI */}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.hud}>
            <Text style={styles.hudText}>
            {/*Do {targetReps} {exercise}*/}
            elbow: {Number.isFinite(debugAngle) ? debugAngle.toFixed(0) : "--"}° ({debugSide})
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
