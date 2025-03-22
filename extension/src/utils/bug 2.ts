const BUG_THRESHOLD = 0.5;

export const hasBugRandomly = (): boolean => Math.random() < BUG_THRESHOLD;