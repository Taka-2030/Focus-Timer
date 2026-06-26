const STORAGE_KEY = 'focus-pomodoro-app';

export const defaultSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  themeColor: '#e85d55',
  autoStartNext: false,
  soundEnabled: true,
  startSoundEnabled: true,
  volume: 0.65,
  language: getInitialLanguage(),
  developerMode: false,
};

export const defaultGameState = {
  cookies: 0,
  purchasedItems: {},
  purchasedUpgrades: [],
  currentStreak: 0,
  totalCookiesEarned: 0,
  selectedTimerDesign: 'ring',
  ownedTimerDesigns: ['ring'],
};

const defaultData = {
  tasks: [],
  sessions: [],
  settings: defaultSettings,
  gameState: defaultGameState,
};

export function loadAppData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeAppData(saved);
  } catch {
    return defaultData;
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeAppData(data)));
}

export function loadTasks() {
  return loadAppData().tasks;
}

export function saveTasks(tasks) {
  const current = loadAppData();
  saveAppData({ ...current, tasks });
}

export function loadSettings() {
  return loadAppData().settings;
}

export function saveSettings(settings) {
  const current = loadAppData();
  saveAppData({ ...current, settings });
}

export function loadSessions() {
  return loadAppData().sessions;
}

export function saveSessions(sessions) {
  const current = loadAppData();
  saveAppData({ ...current, sessions });
}

export function loadGameState() {
  return loadAppData().gameState;
}

export function saveGameState(gameState) {
  const current = loadAppData();
  saveAppData({ ...current, gameState });
}

export function addCookiesForDebug(amount, gameState = loadGameState()) {
  const nextGameState = {
    ...gameState,
    cookies: Number(gameState.cookies || 0) + amount,
    totalCookiesEarned: Number(gameState.totalCookiesEarned || 0) + amount,
  };
  saveGameState(nextGameState);
  return nextGameState;
}

export function resetCookiesForDebug(gameState = loadGameState()) {
  const nextGameState = {
    ...gameState,
    cookies: 0,
  };
  saveGameState(nextGameState);
  return nextGameState;
}

export function unlockAllTimerDesignsForDebug(gameState = loadGameState()) {
  const nextGameState = {
    ...gameState,
    ownedTimerDesigns: ['ring', 'flip', 'water'],
  };
  saveGameState(nextGameState);
  return nextGameState;
}

export function resetTimerDesignsForDebug(gameState = loadGameState()) {
  const nextGameState = {
    ...gameState,
    selectedTimerDesign: 'ring',
    ownedTimerDesigns: ['ring'],
  };
  saveGameState(nextGameState);
  return nextGameState;
}

export function resetGameStateForDebug() {
  const nextGameState = structuredClone(defaultGameState);
  saveGameState(nextGameState);
  return nextGameState;
}

function normalizeAppData(data) {
  return {
    ...defaultData,
    ...(data ?? {}),
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    settings: { ...defaultSettings, ...(data?.settings ?? {}) },
    gameState: {
      ...defaultGameState,
      ...(data?.gameState ?? {}),
      purchasedItems:
        data?.gameState?.purchasedItems && typeof data.gameState.purchasedItems === 'object'
          ? data.gameState.purchasedItems
          : {},
      purchasedUpgrades: Array.isArray(data?.gameState?.purchasedUpgrades)
        ? data.gameState.purchasedUpgrades
        : [],
      selectedTimerDesign: data?.gameState?.selectedTimerDesign || 'ring',
      ownedTimerDesigns: normalizeOwnedTimerDesigns(data?.gameState?.ownedTimerDesigns),
    },
  };
}

function normalizeOwnedTimerDesigns(ownedTimerDesigns) {
  const owned = Array.isArray(ownedTimerDesigns) ? ownedTimerDesigns : [];
  return Array.from(new Set(['ring', ...owned]));
}

function getInitialLanguage() {
  if (typeof localStorage !== 'undefined') {
    const savedLanguage = localStorage.getItem('focus-language');
    if (savedLanguage === 'ja' || savedLanguage === 'en') return savedLanguage;
  }

  if (typeof navigator !== 'undefined') {
    return navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  }

  return 'ja';
}
