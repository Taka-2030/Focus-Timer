export const BACKGROUND_THEMES = ['default', 'forest', 'cyber', 'library', 'space', 'cafe', 'rainy', 'minimal'];

export function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 16) return 'day';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

export function calculateGrowthLevel(completedWorkSessions = 0) {
  const count = Math.max(0, Number(completedWorkSessions) || 0);
  if (count >= 50) return 5;
  if (count >= 30) return 4;
  if (count >= 15) return 3;
  if (count >= 5) return 2;
  return 1;
}

export function createDefaultBackgroundState() {
  return {
    theme: 'default',
    growthLevel: 1,
    completedWorkSessions: 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function normalizeBackgroundState(backgroundState) {
  const completedWorkSessions = Math.max(
    0,
    Number(backgroundState?.completedWorkSessions) || 0,
  );
  const theme = BACKGROUND_THEMES.includes(backgroundState?.theme)
    ? backgroundState.theme
    : 'default';

  return {
    ...createDefaultBackgroundState(),
    ...(backgroundState ?? {}),
    theme,
    completedWorkSessions,
    growthLevel: calculateGrowthLevel(completedWorkSessions),
    lastUpdatedAt:
      typeof backgroundState?.lastUpdatedAt === 'string'
        ? backgroundState.lastUpdatedAt
        : new Date().toISOString(),
  };
}

export function updateBackgroundOnWorkComplete(backgroundState, completedAt = new Date()) {
  const current = normalizeBackgroundState(backgroundState);
  const completedWorkSessions = current.completedWorkSessions + 1;

  return {
    ...current,
    completedWorkSessions,
    growthLevel: calculateGrowthLevel(completedWorkSessions),
    lastUpdatedAt: completedAt.toISOString(),
  };
}

export function getBackgroundClassName(backgroundState, timePeriod = getTimePeriod()) {
  const current = normalizeBackgroundState(backgroundState);
  return [
    'background-layer',
    `bg-theme-${current.theme}`,
    `bg-period-${timePeriod}`,
    `bg-growth-level-${current.growthLevel}`,
  ].join(' ');
}
