// scripts/useBlockBack.ts

import { useEffect } from "react";
import { BackHandler } from "react-native";

export function useBlockBack(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // returning true means “handled” → prevents default back behavior
      return true;
    });

    return () => sub.remove();
  }, [enabled]);
}
