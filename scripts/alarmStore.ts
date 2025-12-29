import { create } from "zustand";

export type AlarmStatus = "IDLE" | "ARMED" | "RINGING";
export type ExerciseType = "pushups" | "situps"

type AlarmStore = {
  status: AlarmStatus;
  setStatus: (s: AlarmStatus) => void;
  arm: () => void;
  ring: () => void;
  stop: () => void;
  exercise: ExerciseType;
  reps: number;
  targetReps: number;
  setExercise: (e: ExerciseType) => void;
  setTargetReps: (n: number) => void;
  incrementRep: (delta?: number) => void;
  resetReps: () => void;
};

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  status: "IDLE",
  setStatus: (s) => set({ status: s }),
  arm: () => set({ status: "ARMED" }),
  ring: () => set({ status: "RINGING", reps: 0 }),
  stop: () => set({ status: "IDLE", reps: 0 }),
  exercise: "pushups",
  reps: 0,
  targetReps: 10,
  setExercise: (e) => set({exercise: e}),
  setTargetReps: (n) => set({targetReps: Math.max(1, Math.floor(n))}),
  incrementRep: (delta = 1) => {
    const { reps, targetReps } = get();
    const next = Math.min(targetReps, reps + delta);
    set({reps: next});
  },
  resetReps: () => set({reps: 0})
}));
