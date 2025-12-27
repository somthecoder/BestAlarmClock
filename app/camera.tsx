import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";

export default function CameraScreen() {
  const isFocused = useIsFocused();

  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);

  const device = useCameraDevice("front"); // TODO: add toggle for front/back

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
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
            If you previously denied, enable it in Android Settings → Apps → Your App → Permissions.
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

      {/* pose stuff */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.hud}>
          <Text style={styles.hudText}>
            {isCameraReady ? "Camera ready" : "Initializing…"}
          </Text>
        </View>
      </View>

      {/* basic controls */}
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => { /* TODO: flip camera */ }}>
          <Text style={styles.buttonText}>Flip (later)</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => { /* TODO: start/stop processing */ }}>
          <Text style={styles.buttonText}>Processing (later)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "black" },
  text: { color: "white", fontSize: 16, textAlign: "center" },
  hint: { color: "#cfcfcf", fontSize: 12, textAlign: "center", marginTop: 12 },
  hud: { paddingTop: 50, paddingHorizontal: 16 },
  hudText: { color: "white", fontSize: 14 },
  controls: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: { color: "white", fontSize: 14 },
});
