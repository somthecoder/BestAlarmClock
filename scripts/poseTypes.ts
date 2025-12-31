// scripts/poseTypes.ts

// MoveNet outputs 17 keypoints × (y, x, score)
export type FlatKeypoints = number[]; // length >= 51