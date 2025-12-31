// app/_layout.tsx

import { Stack } from "expo-router";
import AlarmAudioController from "../components/AlarmAudioController";

export default function RootLayout() {
  return (
    <>
      <AlarmAudioController />
      <Stack />
    </>
  );
}
