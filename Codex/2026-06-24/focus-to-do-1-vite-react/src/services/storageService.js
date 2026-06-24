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
};

const defaultData = {
  tasks: [],
  sessions: [],
  settings: defaultSettings,
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

function normalizeAppData(data) {
  return {
    ...defaultData,
    ...(data ?? {}),
    tasks: Array.isArray(data?.tasks) ? data.tasks : [],
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    settings: { ...defaultSettings, ...(data?.settings ?? {}) },
  };
}
