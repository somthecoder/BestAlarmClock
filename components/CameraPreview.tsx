// components/CameraPreview.tsx

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform, AppState } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  runAtTargetFps,
} from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";
import { useResizePlugin } from "vision-camera-resize-plugin";
import { useTensorflowModel } from "react-native-fast-tflite";
import { useSharedValue } from "react-native-worklets-core";
import type { FlatKeypoints } from "../scripts/poseTypes";

const MODEL = require("../assets/movenet_singlepose_lightning_int8.tflite");

type Props = {
  onPose?: (kps: FlatKeypoints) => void;
  targetFps?: number;
};

export default function CameraPreview({ onPose, targetFps = 10 }: Props) {
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const { resize } = useResizePlugin();

  const [position, setPosition] = useState<"front" | "back">("front");
  const [switching, setSwitching] = useState(false);
  const device = useCameraDevice(position);

  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  const modelState = useTensorflowModel(MODEL);
  const model = modelState.state === "loaded" ? modelState.model : undefined;

  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });
  const [isCameraReady, setIsCameraReady] = useState(false);

  // UI/debug state
  const [kpsForUI, setKpsForUI] = useState<FlatKeypoints>([]);
  const [poseTick, setPoseTick] = useState(0);
  const [hasPose, setHasPose] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  // SharedValues
  const poseSV = useSharedValue<FlatKeypoints>([]);
  const poseTickSV = useSharedValue<number>(0);
  const hasPoseSV = useSharedValue<number>(0);
  const debugSV = useSharedValue<string>("");

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const shouldBeActive = useMemo(() => {
    return Boolean(device) && hasPermission && isFocused && appState === "active" && !switching;
  }, [device, hasPermission, isFocused, appState, switching]);

  useEffect(() => {
    if (!shouldBeActive) setIsCameraReady(false);
  }, [shouldBeActive]);

  // Frame processor with enhanced debugging
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      if (model == null) return;

      runAtTargetFps(targetFps, () => {
        "worklet";

        try {
          const input = resize(frame, {
            scale: { width: 192, height: 192 },
            pixelFormat: "rgb",
            dataType: "uint8",
          });

          const outputs = model.runSync([input]);
          
          // CRITICAL: Debug the raw output structure
          const out0: any = outputs[0];
          
          // Log structure info
          let structInfo = `type:${typeof out0} `;
          if (out0) {
            structInfo += `isArray:${Array.isArray(out0)} `;
            structInfo += `len:${out0.length ?? 'none'} `;
            
            // Check if nested
            if (out0[0]) {
              structInfo += `nested:${Array.isArray(out0[0])} `;
              if (out0[0].length) {
                structInfo += `nest_len:${out0[0].length} `;
              }
            }
          }
          debugSV.value = structInfo;

          // Try multiple ways to extract the data
          let kps: number[] = [];
          
          // Method 1: Direct flat array
          if (Array.isArray(out0) && out0.length >= 51) {
            kps = out0;
          }
          // Method 2: Nested once [1][51]
          else if (Array.isArray(out0) && out0[0] && Array.isArray(out0[0]) && out0[0].length >= 51) {
            kps = Array.from(out0[0]);
          }
          // Method 3: Double nested [1][1][51]
          else if (Array.isArray(out0) && out0[0]?.[0] && Array.isArray(out0[0][0]) && out0[0][0].length >= 51) {
            kps = Array.from(out0[0][0]);
          }
          // Method 4: Shape [17][3] - need to flatten
          else if (Array.isArray(out0) && out0.length === 17 && Array.isArray(out0[0]) && out0[0].length === 3) {
            kps = out0.flat();
          }
          // Method 5: TypedArray
          else if (out0?.length >= 51) {
            kps = Array.from(out0);
          }

          if (kps.length >= 51) {
            poseSV.value = kps;
            poseTickSV.value = poseTickSV.value + 1;
            hasPoseSV.value = 1;
          } else {
            hasPoseSV.value = 0;
          }
        } catch (e: any) {
          debugSV.value = `Error: ${e.message}`;
          hasPoseSV.value = 0;
        }
      });
    },
    [model, resize, targetFps]
  );

  // Poll shared values
  useEffect(() => {
    if (!shouldBeActive) return;

    const ms = Math.max(50, Math.floor(1000 / targetFps));
    const id = setInterval(() => {
      const kps = poseSV.value;
      setHasPose(hasPoseSV.value === 1);
      setPoseTick(poseTickSV.value);
      setDebugInfo(debugSV.value);

      if (kps && kps.length >= 51) {
        setKpsForUI(kps);
        onPose?.(kps);
      }
    }, ms);

    return () => clearInterval(id);
  }, [shouldBeActive, targetFps, onPose, poseSV, hasPoseSV, poseTickSV, debugSV]);

  // Enhanced debug info
  const kp0Text = useMemo(() => {
    if (kpsForUI.length < 3) return "kp0: no data";
    const y0 = kpsForUI[0];
    const x0 = kpsForUI[1];
    const s0 = kpsForUI[2];
    return `kp0: x=${x0.toFixed(3)} y=${y0.toFixed(3)} s=${s0.toFixed(3)}`;
  }, [kpsForUI]);

  const dotsDebug = useMemo(() => {
    if (kpsForUI.length < 51) return "No keypoints";
    let visible = 0;
    for (let i = 0; i < 17; i++) {
      const s = kpsForUI[i * 3 + 2];
      if (s >= 0.15) visible++;
    }
    return `${visible}/17 dots visible`;
  }, [kpsForUI]);

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
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setViewSize({ w: width, h: height });
      }}
    >
      {shouldBeActive ? (
        <Camera
          key={position}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          onInitialized={() => setIsCameraReady(true)}
          frameProcessor={model ? frameProcessor : undefined}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>Camera paused…</Text>
        </View>
      )}

      {/* Dot overlay */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {viewSize.w > 0 &&
          viewSize.h > 0 &&
          kpsForUI.length >= 51 &&
          Array.from({ length: 17 }).map((_, i) => {
            let y = kpsForUI[i * 3 + 0];
            let x = kpsForUI[i * 3 + 1];
            const s = kpsForUI[i * 3 + 2];

            // Lower threshold for debugging
            if (s < 0.15) return null;

            // Normalize if needed
            if (x > 1.5 || y > 1.5) {
              x = x / 192;
              y = y / 192;
            }

            const xm = position === "front" ? 1 - x : x;

            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    left: xm * viewSize.w - 4,
                    top: y * viewSize.h - 4,
                    opacity: Math.min(1, Math.max(0.3, s)),
                  },
                ]}
              />
            );
          })}
      </View>

      {/* Enhanced HUD */}
      <View style={styles.hud}>
        <Pressable
          style={styles.flipButton}
          onPress={() => {
            setIsCameraReady(false);
            setSwitching(true);
            setTimeout(() => {
              setPosition((p) => (p === "front" ? "back" : "front"));
              setSwitching(false);
            }, 250);
          }}
        >
          <Text style={styles.flipText}>{position === "front" ? "Use Back" : "Use Front"}</Text>
        </Pressable>

        <Text style={styles.hudText}>
          {isCameraReady ? "✓ Ready" : "⏳ Init…"} • {model ? "✓ Model" : "✗ Model"}
        </Text>

        <Text style={styles.hudText}>
          Pose: {hasPose ? "✓" : "✗"} • Ticks: {poseTick}
        </Text>

        <Text style={styles.hudText}>{kp0Text}</Text>
        
        <Text style={styles.hudText}>{dotsDebug}</Text>

        <Text style={styles.hudText}>Data: {kpsForUI.length} values</Text>

        <Text style={styles.hudText} numberOfLines={2}>
          {debugInfo || "Waiting..."}
        </Text>

        <Text style={styles.hudText}>
          View: {viewSize.w.toFixed(0)}×{viewSize.h.toFixed(0)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "black" },
  text: { color: "white", fontSize: 16, textAlign: "center" },

  button: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 12 },
  buttonText: { color: "white" },

  hud: {
    position: "absolute",
    top: 46,
    right: 16,
    alignItems: "flex-end",
    gap: 4,
    maxWidth: 250,
  },
  hudText: { 
    color: "#cfcfcf", 
    fontSize: 11,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  flipButton: { backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
  flipText: { color: "white", fontSize: 13, fontWeight: "600" },

  dot: { 
    position: "absolute", 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: "lime",
    borderWidth: 2,
    borderColor: "white",
  },
});