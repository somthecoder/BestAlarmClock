import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";

export default function CameraPreview() {
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [position, setPosition] = useState<"front" | "back">("front");

  const device = useCameraDevice(position);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const canRenderCamera = useMemo(() => {
    return Boolean(device) && hasPermission && isFocused;
  }, [device, hasPermission, isFocused]);

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading camera device…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </Pressable>

        {Platform.OS === "android" ? (
          <Text style={styles.hint}>
            If previously denied, enable it in Android Settings → Apps → Your App → Permissions.
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {canRenderCamera ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={canRenderCamera}
          onInitialized={() => setIsCameraReady(true)}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>Camera paused…</Text>
        </View>
      )}

      <View style={styles.flipRow}>
        <Pressable
          style={styles.flipButton}
          onPress={() => {
            setIsCameraReady(false);
            setPosition((p) => (p === "front" ? "back" : "front"));
          }}
        >
          <Text style={styles.flipText}>{position === "front" ? "Use Back" : "Use Front"}</Text>
        </Pressable>
        <Text style={styles.flipHint}>{isCameraReady ? "Ready" : "Init…"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "black" },
  text: { color: "white", fontSize: 16, textAlign: "center" },
  hint: { color: "#cfcfcf", fontSize: 12, textAlign: "center", marginTop: 12 },
  button: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 12 },
  buttonText: { color: "white" },

  flipRow: {
    position: "absolute",
    top: 46,
    right: 16,
    alignItems: "flex-end",
    gap: 6,
  },
  flipButton: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  flipText: { color: "white", fontSize: 13, fontWeight: "600" },
  flipHint: { color: "#cfcfcf", fontSize: 12 },
});
