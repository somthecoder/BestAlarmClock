import React, { useEffect, useRef } from "react";
import { Vibration } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useAlarmStore } from "../scripts/alarmStore";

const alarmSound = require("../assets/alarm.mp3");

export default function AlarmAudioController() {
  const status = useAlarmStore((s) => s.status);
  const player = useAudioPlayer(alarmSound);

  const playingRef = useRef(false);

  useEffect(() => {
    if (!player?.isLoaded) return;

    if (status === "RINGING") {
      if (playingRef.current) return;

      try {
        player.loop = true;
        player.seekTo(0);
        player.play();
        Vibration.vibrate([500, 500], true);
        playingRef.current = true;
      } catch (e) {
        console.warn("AlarmAudioController: start failed:", e);
      }
    } else {
      if (!playingRef.current) return;

      try {
        Vibration.cancel();
        player.pause();
        player.seekTo(0);
      } catch (e) {
        console.warn("AlarmAudioController: stop failed:", e);
      } finally {
        playingRef.current = false;
      }
    }
  }, [status, player]);

  useEffect(() => {
    return () => {
      Vibration.cancel();
    };
  }, []);

  return null;
}
