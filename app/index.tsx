import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { useAlarmStore, ExerciseType } from "../scripts/alarmStore";

export default function IndexScreen() {
  const {
    status,
    timeoutId,
    exercise,
    targetReps,
    setExercise,
    setTargetReps,
    scheduleInSeconds,
    cancel,
  } = useAlarmStore();

  const [seconds, setSeconds] = useState(10);

  const armed = useMemo(() => status === "ARMED" && timeoutId != null, [status, timeoutId]);

  const setAlarm = () => {
    scheduleInSeconds(seconds, () => {
      // Move to the alarm screen when it fires
      router.replace("/alarm");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BestAlarmClock</Text>
      <Text style={styles.subtitle}>Status: {status}</Text>

      {/* Exercise selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Exercise</Text>

        <View style={styles.row}>
          <Pressable
            style={[styles.pill, exercise === "pushups" && styles.pillActive]}
            onPress={() => setExercise("pushups")}
          >
            <Text style={styles.pillText}>Pushups</Text>
          </Pressable>

          <Pressable
            style={[styles.pill, exercise === "situps" && styles.pillActive]}
            onPress={() => setExercise("situps")}
          >
            <Text style={styles.pillText}>Situps</Text>
          </Pressable>
        </View>
      </View>

      {/* Target reps */}
      <View style={styles.section}>
        <Text style={styles.label}>Target reps</Text>

        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={() => setTargetReps(Math.max(1, targetReps - 1))}>
            <Text style={styles.btnText}>-</Text>
          </Pressable>

          <Text style={styles.bigValue}>{targetReps}</Text>

          <Pressable style={styles.smallBtn} onPress={() => setTargetReps(targetReps + 1)}>
            <Text style={styles.btnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Test alarm delay */}
      <View style={styles.section}>
        <Text style={styles.label}>Test alarm in</Text>

        <View style={styles.row}>
          <Pressable style={styles.smallBtn} onPress={() => setSeconds((s) => Math.max(5, s - 5))}>
            <Text style={styles.btnText}>-5s</Text>
          </Pressable>

          <Text style={styles.bigValue}>{seconds}s</Text>

          <Pressable style={styles.smallBtn} onPress={() => setSeconds((s) => s + 5)}>
            <Text style={styles.btnText}>+5s</Text>
          </Pressable>
        </View>
      </View>

      {/* Actions */}
      <View style={{ height: 10 }} />

      <Pressable style={[styles.primary, armed && styles.buttonDisabled]} onPress={setAlarm} disabled={armed}>
        <Text style={styles.primaryText}>{armed ? "Alarm Armed" : "Arm Test Alarm"}</Text>
      </Pressable>

      <Pressable style={[styles.secondary, !armed && styles.buttonDisabled]} onPress={cancel} disabled={!armed}>
        <Text style={styles.secondaryText}>Cancel Alarm</Text>
      </Pressable>

      {/* dev shortcut */}
      <Pressable style={styles.link} onPress={() => router.push("/verify")}>
        <Text style={styles.linkText}>Go Verify (dev)</Text>
      </Pressable>

      <Text style={styles.footer}>
        Note: this “test alarm” works while the app is open. Real background alarms come later.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 24,
    justifyContent: "center",
  },
  title: { color: "white", fontSize: 30, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { color: "#cfcfcf", marginBottom: 18, textAlign: "center" },

  section: { marginBottom: 18 },
  label: { color: "#cfcfcf", marginBottom: 10, fontSize: 13 },

  row: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },

  pill: {
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  pillText: { color: "white", fontWeight: "600" },

  smallBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
  bigValue: { color: "white", fontSize: 22, fontWeight: "800", minWidth: 80, textAlign: "center" },

  primary: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },

  secondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: { color: "#cfcfcf", fontSize: 14, fontWeight: "600" },

  buttonDisabled: { opacity: 0.5 },

  link: { marginTop: 14, alignItems: "center" },
  linkText: { color: "#cfcfcf" },

  footer: { color: "#777", fontSize: 12, marginTop: 18, textAlign: "center" },
});
