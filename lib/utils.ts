export const getOpacity = (distance: number) => {
  if (distance === 0) return 1;
  if (distance === 1 || distance === -1) return 0.7;
  if (distance === 2 || distance === -2) return 0.5;
  if (distance === 3 || distance === -3) return 0.3;
  if (distance >= 4 || distance <= -4) return 0.1;
};

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const findCurrentIndex = (lrc: { milliseconds: number }[], currentTimeMs: number): number => {
  let low = 0;
  let high = lrc.length - 1;
  let result = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const line = lrc[mid];
    const nextLine = lrc[mid + 1];

    if (currentTimeMs >= line.milliseconds && (!nextLine || currentTimeMs < nextLine.milliseconds)) {
      result = mid;
      break;
    }

    if (currentTimeMs < line.milliseconds) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};
