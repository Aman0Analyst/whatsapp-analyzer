export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = seconds / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function windowLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${minutes / 60} h`;
}
