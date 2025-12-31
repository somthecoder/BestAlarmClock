// scripts/repCounter.ts

import type { FlatKeypoints } from "../scripts/poseTypes";

// MoveNet keypoints: (y,x,score) * 17
const KP = {
  L_SHOULDER: 5,
  R_SHOULDER: 6,
  L_ELBOW: 7,
  R_ELBOW: 8,
  L_WRIST: 9,
  R_WRIST: 10,
} as const;

function getPoint(kps: FlatKeypoints, idx: number) {
  const y = kps[idx * 3 + 0];
  const x = kps[idx * 3 + 1];
  const s = kps[idx * 3 + 2];
  return { x, y, s };
}

function angleDeg(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  // angle at b between ba and bc
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const mag1 = Math.sqrt(abx * abx + aby * aby);
  const mag2 = Math.sqrt(cbx * cbx + cby * cby);
  if (mag1 < 1e-6 || mag2 < 1e-6) return NaN;

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export type PushupState = "UP" | "DOWN";

export function updatePushupRepCounter(
    kps: FlatKeypoints,
    prevState: PushupState
  ): {
    nextState: PushupState;
    repJustCompleted: boolean;
    elbowAngle: number; // raw angle (may be NaN)
    side: "left" | "right" | "none";
    quality: number; // 0..1
  } {
    const lS = getPoint(kps, KP.L_SHOULDER);
    const lE = getPoint(kps, KP.L_ELBOW);
    const lW = getPoint(kps, KP.L_WRIST);
    const rS = getPoint(kps, KP.R_SHOULDER);
    const rE = getPoint(kps, KP.R_ELBOW);
    const rW = getPoint(kps, KP.R_WRIST);
  
    // Wrist is often the noisiest; don't let it dominate.
    const leftQuality = 0.4 * lS.s + 0.4 * lE.s + 0.2 * lW.s;
    const rightQuality = 0.4 * rS.s + 0.4 * rE.s + 0.2 * rW.s;
  
    const MIN_QUALITY = 0.25;
  
    let side: "left" | "right" | "none" = "none";
    let A = NaN;
    let quality = Math.max(leftQuality, rightQuality);
  
    if (leftQuality >= rightQuality && leftQuality >= MIN_QUALITY) {
      side = "left";
      A = angleDeg(lS, lE, lW);
    } else if (rightQuality >= MIN_QUALITY) {
      side = "right";
      A = angleDeg(rS, rE, rW);
    } else {
      return { nextState: prevState, repJustCompleted: false, elbowAngle: NaN, side: "none", quality };
    }
  
    if (!Number.isFinite(A)) {
      return { nextState: prevState, repJustCompleted: false, elbowAngle: NaN, side, quality };
    }
  
    // More forgiving thresholds (you can tune after it starts working)
    const DOWN_ANGLE = 110;
    const UP_ANGLE = 150;
  
    let nextState = prevState;
    let repJustCompleted = false;
  
    if (prevState === "UP") {
      if (A < DOWN_ANGLE) nextState = "DOWN";
    } else {
      if (A > UP_ANGLE) {
        nextState = "UP";
        repJustCompleted = true;
      }
    }
  
    return { nextState, repJustCompleted, elbowAngle: A, side, quality };
  }
