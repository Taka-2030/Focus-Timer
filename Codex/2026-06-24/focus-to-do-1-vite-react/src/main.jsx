import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  Check,
  Clock3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  ListTodo,
  Volume2,
  ShoppingBag,
} from 'lucide-react';
import ToggleSwitch from './components/ToggleSwitch';
import BackgroundLayer from './components/BackgroundLayer';
import TimerRenderer, { TIMER_DESIGNS } from './components/timerDesigns/TimerRenderer';
import './i18n';
import { useTranslation } from 'react-i18next';
import {
  addCookiesForDebug,
  loadAppData,
  normalizeAppData,
  resetCookiesForDebug,
  resetGameStateForDebug,
  resetTimerDesignsForDebug,
  saveAppData,
  unlockAllTimerDesignsForDebug,
} from './services/storageService';
import {
  createAccountWithEmail,
  signInWithEmail,
  signOutCurrentUser,
  subscribeToAuthState,
} from './services/authService';
import { loadCloudAppData, saveCloudAppData } from './services/cloudSyncService';
import { isFirebaseConfigured } from './services/firebaseClient';
import { getProductionDebugMode } from './services/debugModeService';
import {
  getBackgroundClassName,
  updateBackgroundOnWorkComplete,
} from './services/backgroundService';
import './styles.css';

const isDeveloperPanelAvailable =
  import.meta.env.DEV === true || import.meta.env.VITE_ENABLE_DEV_PANEL === 'true';

const shopItems = [
  { id: 'pencil', nameKey: 'shop.pencil', price: 10, bonus: 1 },
  { id: 'notebook', nameKey: 'shop.notebook', price: 50, bonus: 5 },
  { id: 'library', nameKey: 'shop.library', price: 300, bonus: 20 },
  { id: 'lab', nameKey: 'shop.lab', price: 1000, bonus: 80 },
  { id: 'aiAssistant', nameKey: 'shop.aiAssistant', price: 5000, bonus: 300 },
];

const shopUpgrades = [
  {
    id: 'focusBoost1',
    nameKey: 'shop.focusBoost1',
    price: 100,
    effectKey: 'shop.focusBoost1Effect',
  },
  {
    id: 'streakBonus',
    nameKey: 'shop.streakBonus',
    price: 250,
    effectKey: 'shop.streakBonusEffect',
  },
  {
    id: 'morningBoost',
    nameKey: 'shop.morningBoost',
    price: 500,
    effectKey: 'shop.morningBoostEffect',
  },
];

const backgroundThemeItems = [
  {
    id: 'default',
    nameKey: 'backgroundTheme.default.name',
    descriptionKey: 'backgroundTheme.default.description',
    price: 0,
  },
  {
    id: 'forest',
    nameKey: 'backgroundTheme.forest.name',
    descriptionKey: 'backgroundTheme.forest.description',
    price: 200,
  },
  {
    id: 'library',
    nameKey: 'backgroundTheme.library.name',
    descriptionKey: 'backgroundTheme.library.description',
    price: 450,
  },
  {
    id: 'space',
    nameKey: 'backgroundTheme.space.name',
    descriptionKey: 'backgroundTheme.space.description',
    price: 800,
  },
];

const navItems = [
  { id: 'tasks', labelKey: 'nav.tasks', icon: ListTodo },
  { id: 'timer', labelKey: 'nav.timer', icon: Clock3 },
  { id: 'shop', labelKey: 'nav.shop', icon: ShoppingBag },
  { id: 'stats', labelKey: 'nav.stats', icon: BarChart3 },
  { id: 'settings', labelKey: 'nav.settings', icon: Settings },
];

const modes = {
  work: { labelKey: 'timer.work', settingsKey: 'workMinutes', color: '#e85d55' },
  shortBreak: { labelKey: 'timer.shortBreak', settingsKey: 'shortBreakMinutes', color: '#3aa879' },
  longBreak: { labelKey: 'timer.longBreak', settingsKey: 'longBreakMinutes', color: '#4d78d8' },
};

const icons = {
  cookie: '\uD83C\uDF6A',
  sparkle: '\u2728',
  morning: '\uD83C\uDF05',
  streak: '\uD83D\uDD25',
  target: '\uD83C\uDFAF',
  trophy: '\uD83C\uDFC6',
  priority: '\uD83D\uDCCC',
};

const statsTabs = [
  { id: 'numbers', labelKey: 'stats.numbers' },
  { id: 'bars', labelKey: 'stats.bars' },
];

const shopTabs = [
  { id: 'facilities', labelKey: 'shop.facilities' },
  { id: 'upgrades', labelKey: 'shop.upgrades' },
  { id: 'timerDesigns', labelKey: 'timerDesign.title' },
  { id: 'backgrounds', labelKey: 'backgroundTheme.title' },
];

const achievementDefinitions = [
  {
    id: 'firstFocus',
    nameKey: 'achievements.firstFocus.name',
    descriptionKey: 'achievements.firstFocus.description',
    target: 1,
    getValue: (metrics) => metrics.totalWorkSessions,
  },
  {
    id: 'steadyStarter',
    nameKey: 'achievements.steadyStarter.name',
    descriptionKey: 'achievements.steadyStarter.description',
    target: 5,
    getValue: (metrics) => metrics.totalWorkSessions,
  },
  {
    id: 'deepWork',
    nameKey: 'achievements.deepWork.name',
    descriptionKey: 'achievements.deepWork.description',
    target: 180,
    unitKey: 'common.minutes',
    getValue: (metrics) => metrics.totalFocusMinutes,
  },
  {
    id: 'taskCloser',
    nameKey: 'achievements.taskCloser.name',
    descriptionKey: 'achievements.taskCloser.description',
    target: 3,
    getValue: (metrics) => metrics.completedTasks,
  },
  {
    id: 'cookieSaver',
    nameKey: 'achievements.cookieSaver.name',
    descriptionKey: 'achievements.cookieSaver.description',
    target: 100,
    getValue: (metrics) => metrics.totalCookiesEarned,
  },
  {
    id: 'timerCollector',
    nameKey: 'achievements.timerCollector.name',
    descriptionKey: 'achievements.timerCollector.description',
    target: 3,
    getValue: (metrics) => metrics.ownedTimerDesigns,
  },
];

const backgroundPreviewLevels = [
  { id: 'auto', label: 'Auto' },
  { id: 1, label: 'Lv1' },
  { id: 2, label: 'Lv2' },
  { id: 3, label: 'Lv3' },
  { id: 4, label: 'Lv4' },
  { id: 5, label: 'Lv5' },
];

function minutesToSeconds(minutes) {
  return Math.max(1, Number(minutes) || 1) * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function toDateKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE');
}

function formatDayLabel(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() + diff);
  return start;
}

function clampVolume(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function formatCookies(value) {
  return Math.round(Number(value) || 0).toLocaleString();
}

function createStableId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${timePart}-${randomPart}`;
}

function getItemBonus(purchasedItems) {
  return shopItems.reduce((sum, item) => {
    const count = Number(purchasedItems[item.id] || 0);
    return sum + count * item.bonus;
  }, 0);
}

function hasUpgrade(gameState, upgradeId) {
  return gameState.purchasedUpgrades.includes(upgradeId);
}

function getTodayWorkCount(sessions, date = new Date()) {
  const key = toDateKey(date);
  return sessions.filter(
    (session) => session.mode === 'work' && toDateKey(new Date(session.completedAt)) === key,
  ).length;
}

function getWeekWorkCount(sessions, date = new Date()) {
  const weekStart = getWeekStart(date);
  return sessions.filter(
    (session) => session.mode === 'work' && new Date(session.completedAt) >= weekStart,
  ).length;
}

function getActiveBoostDetails(gameState, options = {}) {
  const {
    sessions = [],
    selectedTask = null,
    date = new Date(),
  } = options;
  const boosts = [];
  const todayWorkCount = getTodayWorkCount(sessions, date);
  const weekWorkCount = getWeekWorkCount(sessions, date);

  if (hasUpgrade(gameState, 'focusBoost1')) {
    boosts.push({ id: 'focusBoost1', labelKey: 'shop.focusBoost1', icon: icons.sparkle, percent: 10 });
  }
  if (hasUpgrade(gameState, 'morningBoost') && date.getHours() < 12) {
    boosts.push({ id: 'morningBoost', labelKey: 'shop.morningBoost', icon: icons.morning, percent: 20 });
  }
  if (hasUpgrade(gameState, 'streakBonus') && (gameState.currentStreak + 1) % 3 === 0) {
    boosts.push({ id: 'streakBonus', labelKey: 'shop.streakBonus', icon: icons.streak, percent: 30 });
  }
  if (todayWorkCount >= 2) {
    boosts.push({ id: 'todayMission', labelKey: 'boostSystem.todayMission.name', icon: icons.target, percent: 10 });
  }
  if (weekWorkCount >= 8) {
    boosts.push({ id: 'weeklyChallenge', labelKey: 'boostSystem.weeklyChallenge.name', icon: icons.trophy, percent: 15 });
  }
  if (selectedTask?.priority === 'high') {
    boosts.push({ id: 'subjectBonus', labelKey: 'boostSystem.subjectBonus.name', icon: icons.priority, percent: 5 });
  }

  return boosts;
}

function getBoostStatusCards(gameState, options = {}) {
  const { sessions = [], selectedTask = null, date = new Date() } = options;
  const todayWorkCount = getTodayWorkCount(sessions, date);
  const weekWorkCount = getWeekWorkCount(sessions, date);
  const statusCards = [
    {
      id: 'todayMission',
      icon: icons.target,
      nameKey: 'boostSystem.todayMission.name',
      descriptionKey: 'boostSystem.todayMission.description',
      percent: 10,
      current: Math.min(todayWorkCount, 2),
      target: 2,
      active: todayWorkCount >= 2,
    },
    {
      id: 'weeklyChallenge',
      icon: icons.trophy,
      nameKey: 'boostSystem.weeklyChallenge.name',
      descriptionKey: 'boostSystem.weeklyChallenge.description',
      percent: 15,
      current: Math.min(weekWorkCount, 8),
      target: 8,
      active: weekWorkCount >= 8,
    },
    {
      id: 'subjectBonus',
      icon: icons.priority,
      nameKey: 'boostSystem.subjectBonus.name',
      descriptionKey: 'boostSystem.subjectBonus.description',
      percent: 5,
      current: selectedTask?.priority === 'high' ? 1 : 0,
      target: 1,
      active: selectedTask?.priority === 'high',
    },
  ];

  return statusCards;
}

function getCookieRewardBreakdown(minutes, gameState, options = {}) {
  const completedAt = options.completedAt ?? new Date();
  const baseReward = Number(minutes) * 0.4;
  const itemBonus = getItemBonus(gameState.purchasedItems);
  const activeBoosts = getActiveBoostDetails(gameState, {
    sessions: options.sessions ?? [],
    selectedTask: options.selectedTask ?? null,
    date: completedAt,
  });
  const boostPercent = getTotalBoostPercent(activeBoosts);
  const multiplier = 1 + boostPercent / 100;

  return {
    baseReward,
    itemBonus,
    activeBoosts,
    boostPercent,
    multiplier,
    total: Math.max(0, Math.round((baseReward + itemBonus) * multiplier * 10) / 10),
  };
}

function calculateCookieReward(minutes, gameState, options = {}) {
  return getCookieRewardBreakdown(minutes, gameState, options).total;
}

function getTotalBoostPercent(boosts) {
  return boosts.reduce((sum, boost) => sum + boost.percent, 0);
}

function getLastSevenDays(sessions) {
  const today = new Date();
  const workSessions = sessions.filter((session) => session.mode === 'work');

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (6 - index));
    const key = toDateKey(date);
    const minutes = workSessions
      .filter((session) => toDateKey(new Date(session.completedAt)) === key)
      .reduce((sum, session) => sum + Number(session.minutes), 0);

    return { key, label: formatDayLabel(date), minutes };
  });
}

function getFocusMetrics(tasks, sessions, gameState) {
  const workSessions = sessions.filter((session) => session.mode === 'work');
  const totalFocusMinutes = workSessions.reduce(
    (sum, session) => sum + Number(session.minutes || 0),
    0,
  );
  const completedTasks = tasks.filter((task) => task.completed).length;

  return {
    totalWorkSessions: workSessions.length,
    totalFocusMinutes,
    completedTasks,
    currentStreak: Number(gameState.currentStreak || 0),
    totalCookiesEarned: Number(gameState.totalCookiesEarned || 0),
    ownedTimerDesigns: Array.isArray(gameState.ownedTimerDesigns)
      ? gameState.ownedTimerDesigns.length
      : 1,
  };
}

function getAchievementProgress(metrics) {
  return achievementDefinitions.map((achievement) => {
    const value = Math.max(0, Number(achievement.getValue(metrics)) || 0);
    const progress = Math.min(100, (value / achievement.target) * 100);
    return {
      ...achievement,
      value,
      progress,
      unlocked: value >= achievement.target,
    };
  });
}

function getFocusLevel(metrics) {
  const xp =
    metrics.totalFocusMinutes +
    metrics.totalWorkSessions * 5 +
    metrics.completedTasks * 10;
  const xpPerLevel = 120;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;

  return {
    level,
    xp,
    xpPerLevel,
    currentLevelXp,
    nextLevelXp: xpPerLevel - currentLevelXp,
    progress: (currentLevelXp / xpPerLevel) * 100,
  };
}

function App() {
  const { t, i18n } = useTranslation();
  const initialData = React.useMemo(() => loadAppData(), []);
  const [activeView, setActiveView] = React.useState('tasks');
  const [tasks, setTasks] = React.useState(initialData.tasks);
  const [sessions, setSessions] = React.useState(initialData.sessions);
  const [settings, setSettings] = React.useState(initialData.settings);
  const [gameState, setGameState] = React.useState(initialData.gameState);
  const [backgroundState, setBackgroundState] = React.useState(initialData.backgroundState);
  const [selectedTaskId, setSelectedTaskId] = React.useState('');
  const [mode, setMode] = React.useState('work');
  const [secondsLeft, setSecondsLeft] = React.useState(() =>
    minutesToSeconds(initialData.settings.workMinutes),
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [audioReady, setAudioReady] = React.useState(false);
  const [rewardToast, setRewardToast] = React.useState(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [timerAnimationResetKey, setTimerAnimationResetKey] = React.useState(0);
  const [isProductionDebugEnabled] = React.useState(() => getProductionDebugMode());
  const [timerDebugFrame, setTimerDebugFrame] = React.useState(null);
  const [lastTaskDebug, setLastTaskDebug] = React.useState(null);
  const [backgroundPreview, setBackgroundPreview] = React.useState({
    growthLevel: 'auto',
  });
  const [authUser, setAuthUser] = React.useState(null);
  const [authStatus, setAuthStatus] = React.useState(
    isFirebaseConfigured ? 'checking' : 'notConfigured',
  );
  const [authError, setAuthError] = React.useState('');
  const [cloudSyncStatus, setCloudSyncStatus] = React.useState('local');
  const shouldAutoStartRef = React.useRef(false);
  const isApplyingCloudDataRef = React.useRef(false);
  const cloudReadyRef = React.useRef(false);
  const cloudSaveTimerRef = React.useRef(null);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const activeMode = modes[mode];
  const modeColor = mode === 'work' ? settings.themeColor : activeMode.color;
  const currentTotalSeconds = minutesToSeconds(settings[modes[mode].settingsKey]);
  const effectiveGrowthLevel =
    backgroundPreview.growthLevel === 'auto'
      ? backgroundState.growthLevel
      : Number(backgroundPreview.growthLevel);
  const backgroundClassName = getBackgroundClassName(
    backgroundState,
    effectiveGrowthLevel,
  );

  const appData = React.useMemo(
    () => normalizeAppData({ tasks, sessions, settings, gameState, backgroundState }),
    [tasks, sessions, settings, gameState, backgroundState],
  );
  const appDataRef = React.useRef(appData);

  React.useEffect(() => {
    appDataRef.current = appData;
  }, [appData]);

  const handleTimerDebugFrame = React.useCallback(
    (frame) => {
      if (!isProductionDebugEnabled) return;
      setTimerDebugFrame(frame);
    },
    [isProductionDebugEnabled],
  );

  React.useEffect(() => {
    saveAppData(appData);

    if (!authUser || !cloudReadyRef.current || isApplyingCloudDataRef.current) return undefined;

    setCloudSyncStatus('saving');
    window.clearTimeout(cloudSaveTimerRef.current);
    cloudSaveTimerRef.current = window.setTimeout(() => {
      saveCloudAppData(authUser.uid, appData)
        .then(() => setCloudSyncStatus('synced'))
        .catch((error) => {
          setCloudSyncStatus('error');
          setAuthError(error.message);
        });
    }, 700);

    return () => window.clearTimeout(cloudSaveTimerRef.current);
  }, [appData, authUser]);

  React.useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setAuthUser(user);
      setAuthError('');

      if (!user) {
        cloudReadyRef.current = false;
        setAuthStatus(isFirebaseConfigured ? 'signedOut' : 'notConfigured');
        setCloudSyncStatus('local');
        return;
      }

      setAuthStatus('loadingCloud');
      setCloudSyncStatus('loading');

      try {
        const cloudData = await loadCloudAppData(user.uid);

        if (cloudData) {
          isApplyingCloudDataRef.current = true;
          setTasks(cloudData.tasks);
          setSessions(cloudData.sessions);
          setSettings(cloudData.settings);
          setGameState(cloudData.gameState);
          setBackgroundState(cloudData.backgroundState);
          window.setTimeout(() => {
            isApplyingCloudDataRef.current = false;
          }, 0);
        } else {
          await saveCloudAppData(user.uid, appDataRef.current);
        }

        cloudReadyRef.current = true;
        setAuthStatus('signedIn');
        setCloudSyncStatus('synced');
      } catch (error) {
        cloudReadyRef.current = false;
        setAuthStatus('error');
        setCloudSyncStatus('error');
        setAuthError(error.message);
      }
    });

    return unsubscribe;
  }, []);

  async function handleSignIn(email, password) {
    setAuthError('');
    setAuthStatus('signingIn');
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      setAuthStatus('signedOut');
      setAuthError(error.message);
    }
  }

  async function handleSignUp(email, password) {
    setAuthError('');
    setAuthStatus('signingIn');
    try {
      await createAccountWithEmail(email, password);
    } catch (error) {
      setAuthStatus('signedOut');
      setAuthError(error.message);
    }
  }

  async function handleSignOut() {
    setAuthError('');
    await signOutCurrentUser();
  }

  async function handleManualCloudSync() {
    if (!authUser) return;
    setCloudSyncStatus('saving');
    try {
      await saveCloudAppData(authUser.uid, appData);
      setCloudSyncStatus('synced');
    } catch (error) {
      setCloudSyncStatus('error');
      setAuthError(error.message);
    }
  }

  React.useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  React.useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  React.useEffect(() => {
    if (!rewardToast) return undefined;
    const id = window.setTimeout(() => setRewardToast(null), 1600);
    return () => window.clearTimeout(id);
  }, [rewardToast]);

  React.useEffect(() => {
    setSecondsLeft(minutesToSeconds(settings[modes[mode].settingsKey]));
    setIsRunning(shouldAutoStartRef.current);
    setTimerAnimationResetKey((current) => current + 1);
    shouldAutoStartRef.current = false;
  }, [mode, settings.workMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  React.useEffect(() => {
    if (!isRunning) return undefined;

    const timerId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timerId);
          window.setTimeout(finishTimer, 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRunning, mode, selectedTaskId, settings, gameState, sessions]);

  function addTask(task) {
    const title = String(task.title ?? '').trim();
    if (!title) return;
    const estimate = Math.max(1, Number(task.estimate) || 1);
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate ?? '') ? task.dueDate : null;
    const priority = ['high', 'medium', 'low'].includes(task.priority) ? task.priority : 'medium';
    const newTask = {
      id: createStableId('task'),
      title,
      estimate,
      priority,
      dueDate,
      completed: false,
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
    };
    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    saveAppData({ tasks: nextTasks, sessions, settings, gameState, backgroundState });
    setSelectedTaskId(newTask.id);
    return {
      newTask,
      beforeLength: tasks.length,
      nextLength: nextTasks.length,
    };
  }

  function updateTask(taskId, updates) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    );
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId('');
  }

  function playSound(type, force = false) {
    if (!settings.soundEnabled || (!audioReady && !force)) return;

    const fileName = type === 'start' ? 'start.mp3' : 'finish.mp3';
    const audio = new Audio(`/sounds/${fileName}`);
    audio.volume = clampVolume(settings.volume);
    audio.play().catch(() => playFallbackTone(type, settings.volume));
  }

  function playFallbackTone(type, volume) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type === 'start' ? 'sine' : 'triangle';
    oscillator.frequency.value = type === 'start' ? 660 : 880;
    gain.gain.value = clampVolume(volume) * 0.18;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }

  function startTimer() {
    setAudioReady(true);
    if (settings.soundEnabled && settings.startSoundEnabled) playSound('start', true);
    setIsRunning(true);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function changeMode(nextMode) {
    shouldAutoStartRef.current = false;
    setMode(nextMode);
  }

  function finishTimer() {
    const currentMode = mode;
    const completedAt = new Date();
    const minutes = Number(settings[modes[currentMode].settingsKey]);
    const session = {
      id: createStableId('session'),
      taskId: currentMode === 'work' ? selectedTaskId : '',
      mode: currentMode,
      minutes,
      completedAt: completedAt.toISOString(),
    };

    playSound('finish');
    setSessions((current) => [session, ...current]);

    if (currentMode === 'work') {
      const reward = calculateCookieReward(minutes, gameState, {
        sessions,
        selectedTask,
        completedAt,
      });
      setGameState((current) => ({
        ...current,
        cookies: current.cookies + reward,
        totalCookiesEarned: current.totalCookiesEarned + reward,
        currentStreak: current.currentStreak + 1,
      }));
      setRewardToast({ id: createStableId('reward'), amount: reward });
      setBackgroundState((current) => updateBackgroundOnWorkComplete(current, completedAt));

      if (selectedTaskId) {
        setTasks((current) =>
          current.map((task) =>
            task.id === selectedTaskId
              ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
              : task,
          ),
        );
      }
    }

    const completedWorkCount =
      sessions.filter((sessionItem) => sessionItem.mode === 'work').length +
      (currentMode === 'work' ? 1 : 0);
    const nextMode =
      currentMode === 'work'
        ? completedWorkCount % 4 === 0
          ? 'longBreak'
          : 'shortBreak'
        : 'work';

    shouldAutoStartRef.current = settings.autoStartNext;
    setMode(nextMode);
  }

  function resetTimer() {
    shouldAutoStartRef.current = false;
    setIsRunning(false);
    setSecondsLeft(minutesToSeconds(settings[modes[mode].settingsKey]));
    setTimerAnimationResetKey((current) => current + 1);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      return;
    }
  }

  function buyItem(item) {
    if (gameState.cookies < item.price) return;
    setGameState((current) => ({
      ...current,
      cookies: current.cookies - item.price,
      purchasedItems: {
        ...current.purchasedItems,
        [item.id]: Number(current.purchasedItems[item.id] || 0) + 1,
      },
    }));
  }

  function buyUpgrade(upgrade) {
    if (gameState.cookies < upgrade.price || hasUpgrade(gameState, upgrade.id)) return;
    setGameState((current) => ({
      ...current,
      cookies: current.cookies - upgrade.price,
      purchasedUpgrades: [...current.purchasedUpgrades, upgrade.id],
    }));
  }

  function buyTimerDesign(design) {
    if (gameState.cookies < design.price || gameState.ownedTimerDesigns.includes(design.id)) return;
    setGameState((current) => ({
      ...current,
      cookies: current.cookies - design.price,
      ownedTimerDesigns: Array.from(new Set([...current.ownedTimerDesigns, design.id])),
      selectedTimerDesign: design.id,
    }));
  }

  function selectTimerDesign(designId) {
    if (!gameState.ownedTimerDesigns.includes(designId)) return;
    setGameState((current) => ({
      ...current,
      selectedTimerDesign: designId,
    }));
  }

  function buyBackgroundTheme(theme) {
    const ownedBackgroundThemes = gameState.ownedBackgroundThemes ?? ['default'];
    if (gameState.cookies < theme.price || ownedBackgroundThemes.includes(theme.id)) return;
    setGameState((current) => ({
      ...current,
      cookies: current.cookies - theme.price,
      ownedBackgroundThemes: Array.from(
        new Set([...(current.ownedBackgroundThemes ?? ['default']), theme.id]),
      ),
    }));
    setBackgroundState((current) => ({ ...current, theme: theme.id }));
  }

  function selectBackgroundTheme(themeId) {
    const ownedBackgroundThemes = gameState.ownedBackgroundThemes ?? ['default'];
    if (!ownedBackgroundThemes.includes(themeId)) return;
    setBackgroundState((current) => ({ ...current, theme: themeId }));
  }

  return (
    <div
      className={`app view-${activeView} ${
        isFullscreen ? `focus-fullscreen fullscreen-design-${gameState.selectedTimerDesign}` : ''
      }`}
      style={{ '--theme': settings.themeColor, '--mode-color': modeColor }}
    >
      <BackgroundLayer
        backgroundState={backgroundState}
        growthLevel={effectiveGrowthLevel}
      />
      <main className="shell">
        <header className="topbar">
          <div className="focus-pill cookie-pill">
            {icons.cookie} {formatCookies(gameState.cookies)} {t('app.cookies')}
          </div>
          <div className="focus-pill">
            <Clock3 size={18} />
            {selectedTask ? selectedTask.title : t('app.noTask')}
          </div>
        </header>

        {activeView === 'tasks' && (
          <TasksView
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onSelectTask={setSelectedTaskId}
            onTaskDebug={isProductionDebugEnabled ? setLastTaskDebug : undefined}
            showTaskDebug={isProductionDebugEnabled}
          />
        )}

        {activeView === 'timer' && (
          <TimerView
            tasks={tasks}
            sessions={sessions}
            selectedTaskId={selectedTaskId}
            setSelectedTaskId={setSelectedTaskId}
            mode={mode}
            setMode={changeMode}
            secondsLeft={secondsLeft}
            totalSeconds={currentTotalSeconds}
            isRunning={isRunning}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            resetTimer={resetTimer}
            audioReady={audioReady}
            rewardToast={rewardToast}
            selectedTask={selectedTask}
            gameState={gameState}
            timerDesignId={gameState.selectedTimerDesign}
            timerAnimationResetKey={timerAnimationResetKey}
            onSelectTimerDesign={selectTimerDesign}
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            onTimerDebugFrame={isProductionDebugEnabled ? handleTimerDebugFrame : undefined}
          />
        )}

        {activeView === 'shop' && (
          <ShopView
            gameState={gameState}
            backgroundState={backgroundState}
            onBuyItem={buyItem}
            onBuyUpgrade={buyUpgrade}
            onBuyTimerDesign={buyTimerDesign}
            onSelectTimerDesign={selectTimerDesign}
            onBuyBackgroundTheme={buyBackgroundTheme}
            onSelectBackgroundTheme={selectBackgroundTheme}
          />
        )}

        {activeView === 'stats' && (
          <StatsView
            tasks={tasks}
            sessions={sessions}
            gameState={gameState}
            workMinutes={settings.workMinutes}
            selectedTask={selectedTask}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            resetTimer={resetTimer}
            currentLanguage={i18n.language}
            gameState={gameState}
            setGameState={setGameState}
            backgroundState={backgroundState}
            backgroundPreview={backgroundPreview}
            setBackgroundPreview={setBackgroundPreview}
            effectiveGrowthLevel={effectiveGrowthLevel}
            authUser={authUser}
            authStatus={authStatus}
            authError={authError}
            cloudSyncStatus={cloudSyncStatus}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            onSignOut={handleSignOut}
            onManualCloudSync={handleManualCloudSync}
          />
        )}
      </main>

      {isProductionDebugEnabled && (
        <ProductionDebugPanel
          timerDesignId={gameState.selectedTimerDesign}
          mode={mode}
          isRunning={isRunning}
          secondsLeft={secondsLeft}
          totalSeconds={currentTotalSeconds}
          isFullscreen={isFullscreen}
          timerDebugFrame={timerDebugFrame}
          tasksLength={tasks.length}
          taskDebug={lastTaskDebug}
          backgroundState={backgroundState}
          backgroundPreview={backgroundPreview}
          effectiveGrowthLevel={effectiveGrowthLevel}
          backgroundClassName={backgroundClassName}
        />
      )}

      <nav className="bottom-nav" aria-label={t('nav.main')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeView === item.id ? 'nav-button active' : 'nav-button'}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <Icon size={21} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ProductionDebugPanel({
  timerDesignId,
  mode,
  isRunning,
  secondsLeft,
  totalSeconds,
  isFullscreen,
  timerDebugFrame,
  tasksLength,
  taskDebug,
  backgroundState,
  backgroundPreview,
  effectiveGrowthLevel,
  backgroundClassName,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const fallbackProgress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const progress = clamp01(timerDebugFrame?.progress ?? fallbackProgress);
  const displayedProgress = clamp01(timerDebugFrame?.displayedProgress ?? progress);
  const remainingTime = Math.max(0, timerDebugFrame?.remainingTime ?? secondsLeft);
  const elapsedTime = Math.max(0, timerDebugFrame?.elapsedTime ?? totalSeconds - secondsLeft);
  const waterLevel = progress * 100;
  const activeClass = `timer-design-${timerDesignId}${
    isFullscreen ? ` fullscreen-design-${timerDesignId}` : ''
  }`;

  return (
    <aside className={`production-debug-panel ${isOpen ? 'expanded' : ''}`}>
      <button
        className="production-debug-toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <strong>DEBUG</strong>
        <span>{timerDesignId}</span>
        <span>{Math.round(progress * 100)}%</span>
      </button>

      {isOpen && (
        <div className="production-debug-body">
          <ProductionDebugSection title="Timer">
            <ProductionDebugRow label="selectedTimerDesign" value={timerDesignId} />
            <ProductionDebugRow label="mode" value={mode} />
            <ProductionDebugRow label="isRunning" value={String(isRunning)} />
            <ProductionDebugRow label="remainingTime" value={formatDebugNumber(remainingTime)} />
            <ProductionDebugRow label="elapsedTime" value={formatDebugNumber(elapsedTime)} />
            <ProductionDebugRow label="totalTime" value={formatDebugNumber(totalSeconds)} />
            <ProductionDebugRow label="progress" value={formatDebugNumber(progress)} />
            <ProductionDebugRow label="isFullscreen" value={String(isFullscreen)} />
          </ProductionDebugSection>

          <ProductionDebugSection title="Ring">
            <ProductionDebugRow label="ringProgress" value={formatDebugNumber(progress)} />
            <ProductionDebugRow label="displayedProgress" value={formatDebugNumber(displayedProgress)} />
            <ProductionDebugRow label="rafTimestamp" value={formatDebugNumber(timerDebugFrame?.timestamp)} />
            <ProductionDebugRow label="rafActive" value={String(Boolean(timerDebugFrame?.rafActive))} />
          </ProductionDebugSection>

          <ProductionDebugSection title="Water">
            <ProductionDebugRow label="waterLevel" value={`${formatDebugNumber(waterLevel)}%`} />
            <ProductionDebugRow label="progress" value={formatDebugNumber(progress)} />
            <ProductionDebugRow
              label="elapsed / total"
              value={`${formatDebugNumber(elapsedTime)} / ${formatDebugNumber(totalSeconds)}`}
            />
            <ProductionDebugRow label="pausedValueStable" value={String(!isRunning)} />
          </ProductionDebugSection>

          <ProductionDebugSection title="Flip">
            <ProductionDebugRow label="fullscreen" value={String(isFullscreen)} />
            <ProductionDebugRow label="designClass" value={activeClass} />
            <ProductionDebugRow label="activeCssClass" value={isRunning ? 'flip-timer running' : 'flip-timer'} />
          </ProductionDebugSection>

          <ProductionDebugSection title="Task">
            <ProductionDebugRow label="tasks.length" value={tasksLength} />
            <ProductionDebugRow label="lastAddTaskSource" value={taskDebug?.source ?? '-'} />
            <ProductionDebugRow label="lastAddTaskResult" value={taskDebug?.status ?? '-'} />
            <ProductionDebugRow label="lastError" value={taskDebug?.error || '-'} />
            <ProductionDebugRow
              label="before -> next"
              value={taskDebug ? `${taskDebug.tasksLength} -> ${taskDebug.nextTasksLength}` : '-'}
            />
            <ProductionDebugRow label="afterRender" value={taskDebug?.afterRenderTasksLength ?? '-'} />
          </ProductionDebugSection>

          <ProductionDebugSection title="Background">
            <ProductionDebugRow label="backgroundTheme" value={backgroundState.theme} />
            <ProductionDebugRow label="growthLevel" value={backgroundState.growthLevel} />
            <ProductionDebugRow
              label="previewGrowthLevel"
              value={backgroundPreview.growthLevel}
            />
            <ProductionDebugRow label="effectiveGrowthLevel" value={effectiveGrowthLevel} />
            <ProductionDebugRow
              label="completedWorkSessions"
              value={backgroundState.completedWorkSessions}
            />
            <ProductionDebugRow label="backgroundClassName" value={backgroundClassName} />
            <ProductionDebugRow label="lastUpdatedAt" value={backgroundState.lastUpdatedAt} />
          </ProductionDebugSection>
        </div>
      )}
    </aside>
  );
}

function ProductionDebugSection({ title, children }) {
  return (
    <section className="production-debug-section">
      <h2>{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

function ProductionDebugRow({ label, value }) {
  return (
    <div className="production-debug-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function formatDebugNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(3).replace(/\.?0+$/, '');
}

function TasksView({
  tasks,
  selectedTaskId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onTaskDebug,
  showTaskDebug = false,
}) {
  const { t } = useTranslation();
  const initialDraft = {
    title: '',
    estimate: 4,
    priority: 'medium',
    dueDate: '',
  };
  const [draft, setDraft] = React.useState(initialDraft);
  const formRef = React.useRef(null);
  const titleInputRef = React.useRef(null);
  const estimateInputRef = React.useRef(null);
  const prioritySelectRef = React.useRef(null);
  const dueDateInputRef = React.useRef(null);
  const taskListRef = React.useRef(null);
  const lastAddRef = React.useRef({ signature: '', time: 0 });
  const [taskDebug, setTaskDebug] = React.useState(null);

  function readTaskDraftFromInputs() {
    const title = String(titleInputRef.current?.value ?? draft.title).trim();
    const estimate = Number(estimateInputRef.current?.value ?? draft.estimate) || 1;
    const priority = String(prioritySelectRef.current?.value ?? draft.priority);
    const dueDateValue = String(dueDateInputRef.current?.value ?? draft.dueDate);

    return {
      title,
      estimate,
      priority,
      dueDate: dueDateValue || null,
    };
  }

  React.useEffect(() => {
    function withAfterRender(current) {
      if (!current || current.status !== 'task added') return current;
      return { ...current, afterRenderTasksLength: tasks.length };
    }

    onTaskDebug?.((current) => withAfterRender(current));
    if (showTaskDebug) {
      setTaskDebug((current) => withAfterRender(current));
    }
  }, [tasks.length, onTaskDebug, showTaskDebug]);

  function updateTaskDebug(source, values, status, details = {}) {
    const beforeLength = details.beforeLength ?? tasks.length;
    const nextLength = details.nextLength ?? beforeLength;
    const debugPayload = {
      source,
      status,
      title: values?.title ?? '',
      dueDate: values?.dueDate ?? null,
      tasksLength: beforeLength,
      nextTasksLength: nextLength,
      afterRenderTasksLength: details.afterRenderTasksLength ?? null,
      newTaskId: details.newTask?.id ?? null,
      error: details.error ?? '',
      time: new Date().toLocaleTimeString(),
    };
    onTaskDebug?.(debugPayload);
    if (!showTaskDebug) return;
    setTaskDebug(debugPayload);
  }

  function handleAddTask(event, source = event?.type ?? 'manual') {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const nextTask = readTaskDraftFromInputs();
    const { title, estimate, priority, dueDate } = nextTask;

    updateTaskDebug(source, nextTask, 'handleAddTask called');
    if (!title) {
      updateTaskDebug(source, nextTask, 'empty title');
      return;
    }
    const signature = JSON.stringify({
      title,
      estimate,
      priority,
      dueDate,
    });
    const now = Date.now();

    if (lastAddRef.current.signature === signature && now - lastAddRef.current.time < 800) {
      updateTaskDebug(source, nextTask, 'duplicate blocked');
      return;
    }

    let addResult;
    try {
      addResult = onAddTask({
        title,
        estimate,
        priority,
        dueDate,
      });
    } catch (error) {
      updateTaskDebug(source, nextTask, 'add failed', {
        beforeLength: tasks.length,
        nextLength: tasks.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    lastAddRef.current = { signature, time: now };
    updateTaskDebug(source, nextTask, 'task added', {
      beforeLength: addResult?.beforeLength ?? tasks.length,
      nextLength: addResult?.nextLength ?? tasks.length + 1,
      newTask: addResult?.newTask ?? null,
    });
    setDraft(initialDraft);

    window.requestAnimationFrame(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      taskListRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  function submitFormFromTitle(event) {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    handleAddTask(event, 'title enter');
  }

  return (
    <section className="view-stack">
      <form
        className="task-form"
        ref={formRef}
        onSubmit={(event) => handleAddTask(event, 'form submit')}
        noValidate
      >
        <label>
          {t('tasks.name')}
            <input
              ref={titleInputRef}
              name="task-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              onKeyDown={submitFormFromTitle}
              placeholder={t('tasks.placeholder')}
              autoComplete="off"
            />
        </label>
        <div className="form-grid">
          <label>
            {t('tasks.estimate')}
            <input
              ref={estimateInputRef}
              min="1"
              name="task-estimate"
              type="number"
              value={draft.estimate}
              onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
            />
          </label>
          <label>
            {t('tasks.priority')}
            <select
              ref={prioritySelectRef}
              name="task-priority"
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
            >
              <option value="high">{t('common.high')}</option>
              <option value="medium">{t('common.medium')}</option>
              <option value="low">{t('common.low')}</option>
            </select>
          </label>
          <label>
            {t('tasks.dueDate')}
            <input
              ref={dueDateInputRef}
              name="task-due-date"
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
            />
          </label>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={(event) => handleAddTask(event, 'button click')}
          onTouchEnd={(event) => handleAddTask(event, 'button touchend')}
        >
          <Plus size={18} />
          {t('common.add')}
        </button>
        {showTaskDebug && taskDebug && (
          <div className="task-debug-panel" aria-live="polite">
            <strong>DEBUG</strong>
            <span>{taskDebug.status}</span>
            <span>source: {taskDebug.source}</span>
            <span>title: {taskDebug.title || '-'}</span>
            <span>due: {taskDebug.dueDate || '-'}</span>
            <span>
              tasks: {taskDebug.tasksLength} -&gt; {taskDebug.nextTasksLength}
            </span>
            {taskDebug.afterRenderTasksLength !== null && (
              <span>after: {taskDebug.afterRenderTasksLength}</span>
            )}
            {taskDebug.newTaskId && <span>id: {taskDebug.newTaskId}</span>}
            {taskDebug.error && <span>error: {taskDebug.error}</span>}
            <span>{taskDebug.time}</span>
          </div>
        )}
      </form>

      <div className="task-list" ref={taskListRef}>
        {tasks.length === 0 ? (
          <EmptyState title={t('tasks.emptyTitle')} text={t('tasks.emptyText')} />
        ) : (
          tasks.map((task) => (
            <article
              key={task.id}
              className={`task-card ${task.completed ? 'done' : ''} ${
                selectedTaskId === task.id ? 'selected' : ''
              }`}
            >
              <button
                className="check-button"
                onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
                type="button"
                aria-label={t('tasks.toggleComplete')}
              >
                {task.completed && <Check size={16} />}
              </button>
              <button className="task-main" onClick={() => onSelectTask(task.id)} type="button">
                <span className="task-title">{task.title}</span>
                <span className="task-meta">
                  {task.completedPomodoros}/{task.estimate} {t('tasks.pomodoros')}
                  {task.dueDate ? ` ・ ${task.dueDate}` : ''}
                </span>
              </button>
              <span className={`priority ${task.priority}`}>{t(`common.${task.priority}`)}</span>
              <button
                className="icon-button"
                onClick={() => onDeleteTask(task.id)}
                type="button"
                aria-label={t('tasks.delete')}
              >
                <Trash2 size={18} />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function TimerView({
  tasks,
  sessions,
  selectedTaskId,
  setSelectedTaskId,
  mode,
  setMode,
  secondsLeft,
  totalSeconds,
  isRunning,
  startTimer,
  pauseTimer,
  resetTimer,
  audioReady,
  rewardToast,
  selectedTask,
  gameState,
  timerDesignId,
  timerAnimationResetKey,
  onSelectTimerDesign,
  isFullscreen,
  toggleFullscreen,
  onTimerDebugFrame,
}) {
  const { t } = useTranslation();
  const [showBoostDetails, setShowBoostDetails] = React.useState(false);
  const ownedTimerDesigns = TIMER_DESIGNS.filter((design) =>
    gameState.ownedTimerDesigns.includes(design.id),
  );
  const activeBoosts = getActiveBoostDetails(gameState, { sessions, selectedTask });
  const totalBoostPercent = getTotalBoostPercent(activeBoosts);
  const boostChipLabel =
    activeBoosts.length > 1
      ? `${icons.sparkle} ${t('boost.total', { percent: totalBoostPercent })}`
      : activeBoosts.length === 1
        ? `${activeBoosts[0].icon} ${t(activeBoosts[0].labelKey)} +${activeBoosts[0].percent}%`
        : `${icons.sparkle} ${t('boost.none')}`;

  return (
    <section className={`timer-view timer-design-${timerDesignId}`}>
      <TimerRenderer
        timerDesignId={timerDesignId}
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        isRunning={isRunning}
        resetKey={timerAnimationResetKey}
        formatTime={formatTime}
        onDebugFrame={onTimerDebugFrame}
      />

      {rewardToast && (
        <div className="reward-toast" key={rewardToast.id}>
          {t('timer.reward', { amount: formatCookies(rewardToast.amount) })}
        </div>
      )}

      <div className="timer-actions">
        <button className="primary-button large" onClick={isRunning ? pauseTimer : startTimer} type="button">
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? t('timer.pause') : t('timer.start')}
        </button>
        <button className="secondary-button large" onClick={resetTimer} type="button">
          <RotateCcw size={20} />
          {t('timer.reset')}
        </button>
      </div>

      <div className="timer-compact-info">
        <div className="mini-cookie-pill" aria-label={t('cookies.label')}>
          {icons.cookie} {formatCookies(gameState.cookies)}
        </div>
        <button
          className="boost-chip"
          type="button"
          onClick={() => setShowBoostDetails((current) => !current)}
          aria-expanded={showBoostDetails}
        >
          {boostChipLabel}
        </button>
        {showBoostDetails && activeBoosts.length > 0 && (
          <div className="boost-popover">
            {activeBoosts.map((boost) => (
              <span key={boost.id}>
                {boost.icon} {t(boost.labelKey)} +{boost.percent}%
              </span>
            ))}
          </div>
        )}
        <button className="fullscreen-button" type="button" onClick={toggleFullscreen}>
          {isFullscreen ? t('focus.exitFullscreen') : t('timer.fullscreen')}
        </button>
      </div>
      <div className="focus-context">
        <span>{selectedTask ? selectedTask.title : t('app.noTask')}</span>
      </div>

      <div className="timer-options">
        <div className="mode-tabs" role="tablist" aria-label={t('timer.mode')}>
          {Object.entries(modes).map(([key, item]) => (
            <button
              key={key}
              className={mode === key ? 'active' : ''}
              onClick={() => setMode(key)}
              type="button"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="timer-design-switch" aria-label={t('timerDesign.switch')}>
          <span>{t('timerDesign.switch')}</span>
          <div className="timer-design-chips">
            {ownedTimerDesigns.map((design) => (
              <button
                key={design.id}
                className={timerDesignId === design.id ? 'active' : ''}
                type="button"
                onClick={() => onSelectTimerDesign(design.id)}
                aria-label={t('timerDesign.select', { name: t(design.nameKey) })}
              >
                {t(design.nameKey)}
              </button>
            ))}
          </div>
        </div>

        <label className="task-select">
          {t('timer.focusTask')}
          <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
            <option value="">{t('timer.noTask')}</option>
            {tasks
              .filter((task) => !task.completed)
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="sound-note">
        <Volume2 size={17} />
        {audioReady ? t('timer.soundReady') : t('timer.soundLocked')}
      </div>
    </section>
  );
}

function ShopView({
  gameState,
  backgroundState,
  onBuyItem,
  onBuyUpgrade,
  onBuyTimerDesign,
  onSelectTimerDesign,
  onBuyBackgroundTheme,
  onSelectBackgroundTheme,
}) {
  const { t } = useTranslation();
  const [activeShopTab, setActiveShopTab] = React.useState('facilities');
  return (
    <section className="view-stack">
      <div className="shop-summary">
        <span>{t('cookies.label')}</span>
        <strong>{icons.cookie} {formatCookies(gameState.cookies)}</strong>
        <small>{t('common.totalEarned')}: {formatCookies(gameState.totalCookiesEarned)}</small>
      </div>

      <div className="shop-tabs" role="tablist" aria-label={t('shop.categories')}>
        {shopTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeShopTab === tab.id ? 'active' : ''}
            type="button"
            onClick={() => setActiveShopTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeShopTab === 'facilities' && (
      <div className="shop-section">
        <h2>{t('shop.facilities')}</h2>
        <div className="shop-grid">
          {shopItems.map((item) => {
            const count = Number(gameState.purchasedItems[item.id] || 0);
            const canBuy = gameState.cookies >= item.price;
            return (
              <article className="shop-card" key={item.id}>
                <div>
                  <h3>{t(item.nameKey)}</h3>
                  <p>{t('shop.itemEffect', { bonus: item.bonus })}</p>
                </div>
                <div className="shop-meta">
                  <span>{t('common.price')}: {icons.cookie} {item.price.toLocaleString()}</span>
                  <span>{t('common.owned')}: {count}</span>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canBuy}
                  onClick={() => onBuyItem(item)}
                >
                  {t('common.buy')}
                </button>
              </article>
            );
          })}
        </div>
      </div>
      )}

      {activeShopTab === 'upgrades' && (
      <div className="shop-section">
        <h2>{t('shop.upgrades')}</h2>
        <div className="shop-grid">
          {shopUpgrades.map((upgrade) => {
            const purchased = hasUpgrade(gameState, upgrade.id);
            const canBuy = gameState.cookies >= upgrade.price && !purchased;
            return (
              <article className={`shop-card ${purchased ? 'purchased' : ''}`} key={upgrade.id}>
                <div>
                  <h3>{t(upgrade.nameKey)}</h3>
                  <p>{t(upgrade.effectKey)}</p>
                </div>
                <div className="shop-meta">
                  <span>{t('common.price')}: {icons.cookie} {upgrade.price.toLocaleString()}</span>
                  <span>{purchased ? t('common.purchased') : t('common.oneTime')}</span>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canBuy}
                  onClick={() => onBuyUpgrade(upgrade)}
                >
                  {purchased ? t('common.purchased') : t('common.buy')}
                </button>
              </article>
            );
          })}
        </div>
      </div>
      )}

      {activeShopTab === 'timerDesigns' && (
      <div className="shop-section">
        <h2>{t('timerDesign.title')}</h2>
        <div className="shop-grid timer-design-grid">
          {TIMER_DESIGNS.map((design) => {
            const owned = gameState.ownedTimerDesigns.includes(design.id);
            const using = gameState.selectedTimerDesign === design.id;
            const canBuy = gameState.cookies >= design.price && !owned;

            return (
              <article className={`shop-card timer-design-card ${using ? 'using' : ''}`} key={design.id}>
                <TimerDesignPreview designId={design.id} />
                <div>
                  <h3>{t(design.nameKey)}</h3>
                  <p>{t(design.descriptionKey)}</p>
                </div>
                <div className="shop-meta">
                  <span>{t('common.price')}: {icons.cookie} {design.price.toLocaleString()}</span>
                  {owned && <span>{using ? t('timerDesign.using') : t('timerDesign.owned')}</span>}
                  {!owned && !canBuy && <span>{t('timerDesign.notEnoughCookies')}</span>}
                </div>
                {owned ? (
                  <button
                    className={using ? 'secondary-button' : 'primary-button'}
                    type="button"
                    disabled={using}
                    onClick={() => onSelectTimerDesign(design.id)}
                  >
                    {using ? t('timerDesign.using') : t('timerDesign.use')}
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyTimerDesign(design)}
                  >
                    {canBuy ? t('timerDesign.buy') : t('timerDesign.notEnoughCookies')}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
      )}

      {activeShopTab === 'backgrounds' && (
      <div className="shop-section">
        <h2>{t('backgroundTheme.title')}</h2>
        <div className="shop-grid background-theme-grid">
          {backgroundThemeItems.map((theme) => {
            const ownedBackgroundThemes = gameState.ownedBackgroundThemes ?? ['default'];
            const owned = ownedBackgroundThemes.includes(theme.id);
            const using = backgroundState.theme === theme.id;
            const canBuy = gameState.cookies >= theme.price && !owned;

            return (
              <article className={`shop-card background-theme-card ${using ? 'using' : ''}`} key={theme.id}>
                <BackgroundThemePreview themeId={theme.id} />
                <div>
                  <h3>{t(theme.nameKey)}</h3>
                  <p>{t(theme.descriptionKey)}</p>
                </div>
                <div className="shop-meta">
                  <span>{t('common.price')}: {icons.cookie} {theme.price.toLocaleString()}</span>
                  {owned && <span>{using ? t('backgroundTheme.using') : t('backgroundTheme.owned')}</span>}
                  {!owned && !canBuy && <span>{t('backgroundTheme.notEnoughCookies')}</span>}
                </div>
                {owned ? (
                  <button
                    className={using ? 'secondary-button' : 'primary-button'}
                    type="button"
                    disabled={using}
                    onClick={() => onSelectBackgroundTheme(theme.id)}
                  >
                    {using ? t('backgroundTheme.using') : t('backgroundTheme.use')}
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyBackgroundTheme(theme)}
                  >
                    {canBuy ? t('backgroundTheme.buy') : t('backgroundTheme.notEnoughCookies')}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
      )}
    </section>
  );
}

function BackgroundThemePreview({ themeId }) {
  return (
    <div className={`background-theme-preview background-preview-${themeId}`} aria-hidden="true">
      <span className="background-preview-sky" />
      <span className="background-preview-horizon" />
      <span className="background-preview-ground" />
    </div>
  );
}

function TimerDesignPreview({ designId }) {
  return (
    <div className={`timer-design-preview preview-${designId}`} aria-hidden="true">
      {designId === 'flip' && (
        <div className="preview-flip">
          <span>25</span>
          <i />
          <span>00</span>
        </div>
      )}
      {designId === 'water' && (
        <div className="preview-water">
          <span className="preview-water-fill" />
          <span className="preview-water-wave wave-a" />
          <span className="preview-water-wave wave-b" />
          <span className="preview-water-gloss" />
        </div>
      )}
      {designId === 'ring' && (
        <div className="preview-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle className="preview-ring-track" cx="60" cy="60" r="46" />
            <circle className="preview-ring-progress" cx="60" cy="60" r="46" />
          </svg>
          <span className="preview-ring-time">25</span>
        </div>
      )}
    </div>
  );
}

function StatsView({ tasks, sessions, gameState, workMinutes, selectedTask }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('numbers');
  const todayKey = toDateKey();
  const weekStart = getWeekStart(new Date());
  const sevenDayData = getLastSevenDays(sessions);
  const todayWorkSessions = sessions.filter(
    (session) => session.mode === 'work' && toDateKey(new Date(session.completedAt)) === todayKey,
  );
  const weekWorkSessions = sessions.filter(
    (session) => session.mode === 'work' && new Date(session.completedAt) >= weekStart,
  );
  const todayMinutes = todayWorkSessions.reduce((sum, session) => sum + Number(session.minutes), 0);
  const weekMinutes = weekWorkSessions.reduce((sum, session) => sum + Number(session.minutes), 0);
  const completedTasks = tasks.filter((task) => task.completed).length;

  return (
    <section className="view-stack">
      <div className="stats-tabs" role="tablist" aria-label={t('stats.viewType')}>
        {statsTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'numbers' && (
        <div className="stats-grid">
          <StatCard label={t('stats.todayFocus')} value={todayMinutes} unit={t('common.minutes')} />
          <StatCard label={t('stats.todayPomodoros')} value={todayWorkSessions.length} unit={t('common.times')} />
          <StatCard label={t('stats.weekFocus')} value={weekMinutes} unit={t('common.minutes')} />
          <StatCard label={t('stats.completedTasks')} value={completedTasks} unit={t('common.tasks')} />
          <StatCard label={t('stats.totalCookies')} value={formatCookies(gameState.totalCookiesEarned)} unit="" />
          <StatCard label={t('stats.currentStreak')} value={gameState.currentStreak} unit={t('timer.work')} />
        </div>
      )}

      {activeTab === 'bars' && <BarStatsChart data={sevenDayData} />}

      <BoostOverview
        gameState={gameState}
        workMinutes={workMinutes}
        sessions={sessions}
        selectedTask={selectedTask}
      />

      <ProgressOverview tasks={tasks} sessions={sessions} gameState={gameState} />
    </section>
  );
}

function ProgressOverview({ tasks, sessions, gameState }) {
  const { t } = useTranslation();
  const metrics = getFocusMetrics(tasks, sessions, gameState);
  const level = getFocusLevel(metrics);
  const achievements = getAchievementProgress(metrics);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <article className="progress-overview">
      <div className="level-card">
        <span>{t('level.title')}</span>
        <strong>{t('level.current', { level: level.level })}</strong>
        <div className="level-progress">
          <span style={{ width: `${level.progress}%` }} />
        </div>
        <small>
          {t('level.next', {
            current: Math.floor(level.currentLevelXp),
            target: level.xpPerLevel,
            remaining: Math.ceil(level.nextLevelXp),
          })}
        </small>
      </div>

      <div className="achievement-summary">
        <span>{t('achievements.title')}</span>
        <strong>{unlockedCount}/{achievements.length}</strong>
      </div>

      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <div
            className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}
            key={achievement.id}
          >
            <div>
              <span>{achievement.unlocked ? icons.trophy : icons.sparkle}</span>
              <strong>{t(achievement.nameKey)}</strong>
            </div>
            <p>{t(achievement.descriptionKey)}</p>
            <div className="achievement-progress-row">
              <div className="achievement-progress-track">
                <span style={{ width: `${achievement.progress}%` }} />
              </div>
              <small>
                {formatCookies(achievement.value)}/{formatCookies(achievement.target)}
                {achievement.unitKey ? ` ${t(achievement.unitKey)}` : ''}
              </small>
            </div>
            <em>{achievement.unlocked ? t('achievements.unlocked') : t('achievements.locked')}</em>
          </div>
        ))}
      </div>
    </article>
  );
}

function BoostOverview({ gameState, workMinutes, sessions, selectedTask }) {
  const { t } = useTranslation();
  const activeBoosts = getActiveBoostDetails(gameState, { sessions, selectedTask });
  const totalBoostPercent = getTotalBoostPercent(activeBoosts);
  const ownedUpgrades = shopUpgrades.filter((upgrade) => hasUpgrade(gameState, upgrade.id));
  const streakProgress = Number(gameState.currentStreak) % 3;
  const nextStreakCount = streakProgress === 0 ? 3 : 3 - streakProgress;
  const rewardBreakdown = getCookieRewardBreakdown(workMinutes, gameState, {
    sessions,
    selectedTask,
  });
  const boostStatusCards = getBoostStatusCards(gameState, { sessions, selectedTask });

  return (
    <article className="boost-overview">
      <div className="boost-overview-head">
        <div>
          <span>{t('boostOverview.title')}</span>
          <strong>
            {activeBoosts.length > 0
              ? t('boost.total', { percent: totalBoostPercent })
              : t('boost.none')}
          </strong>
        </div>
        <div className="boost-reward-preview">
          <span>{t('boostOverview.nextReward')}</span>
          <strong>{icons.cookie} {formatCookies(rewardBreakdown.total)}</strong>
          <small>
            {t('boostOverview.rewardFormula', {
              base: formatCookies(rewardBreakdown.baseReward),
              facilities: formatCookies(rewardBreakdown.itemBonus),
              multiplier: Math.round(rewardBreakdown.multiplier * 100),
            })}
          </small>
        </div>
      </div>

      <div className="boost-overview-list">
        <span>{t('boostOverview.purchasedUpgrades')}</span>
        <div>
          {ownedUpgrades.length > 0 ? (
            ownedUpgrades.map((upgrade) => <strong key={upgrade.id}>{t(upgrade.nameKey)}</strong>)
          ) : (
            <strong>{t('boostOverview.noOwnedUpgrades')}</strong>
          )}
        </div>
        {hasUpgrade(gameState, 'streakBonus') && (
          <small>{t('boostOverview.nextStreakBonus', { count: nextStreakCount })}</small>
        )}
      </div>

      <div className="boost-status-grid">
        {boostStatusCards.map((boost) => {
          const progress = Math.min(100, (boost.current / boost.target) * 100);
          return (
            <div className={`boost-status-card ${boost.active ? 'active' : ''}`} key={boost.id}>
              <div>
                <span>{boost.icon} {t(boost.nameKey)}</span>
                <strong>+{boost.percent}%</strong>
              </div>
              <p>{t(boost.descriptionKey)}</p>
              <div className="boost-progress-row">
                <div className="boost-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <small>
                  {boost.current}/{boost.target}
                </small>
              </div>
              <em>{boost.active ? t('boost.active') : t('boostSystem.inProgress')}</em>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </article>
  );
}

function BarStatsChart({ data }) {
  const { t } = useTranslation();
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 60);

  return (
    <article className="chart-card">
      <div className="chart-heading">
        <h2>{t('stats.lastSevenDays')}</h2>
        <span>{t('common.max')} {maxMinutes} {t('common.minutes')}</span>
      </div>
      <div className="bar-chart" aria-label={t('stats.lastSevenDays')}>
        {data.map((item) => {
          const height = Math.max(4, (item.minutes / maxMinutes) * 100);
          return (
            <div className="bar-item" key={item.key}>
              <div className="bar-value">{item.minutes}{t('common.minutes')}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ height: `${height}%` }} />
              </div>
              <div className="chart-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function SettingsView({
  settings,
  setSettings,
  resetTimer,
  currentLanguage,
  gameState,
  setGameState,
  backgroundState,
  backgroundPreview,
  setBackgroundPreview,
  effectiveGrowthLevel,
  authUser,
  authStatus,
  authError,
  cloudSyncStatus,
  onSignIn,
  onSignUp,
  onSignOut,
  onManualCloudSync,
}) {
  const { t, i18n } = useTranslation();
  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    resetTimer();
  }

  function updateLanguage(language) {
    i18n.changeLanguage(language);
    setSettings((current) => ({ ...current, language }));
  }

  return (
    <section className="settings-panel">
      <FirebaseSyncPanel
        authUser={authUser}
        authStatus={authStatus}
        authError={authError}
        cloudSyncStatus={cloudSyncStatus}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onSignOut={onSignOut}
        onManualCloudSync={onManualCloudSync}
      />
      <NumberSetting
        label={t('settings.workTime')}
        value={settings.workMinutes}
        onChange={(value) => updateSetting('workMinutes', value)}
      />
      <NumberSetting
        label={t('settings.shortBreak')}
        value={settings.shortBreakMinutes}
        onChange={(value) => updateSetting('shortBreakMinutes', value)}
      />
      <NumberSetting
        label={t('settings.longBreak')}
        value={settings.longBreakMinutes}
        onChange={(value) => updateSetting('longBreakMinutes', value)}
      />
      <label className="setting-row language-row">
        <span>
          {t('settings.language')}
          <small>{t(`language.${currentLanguage}`)} &gt;</small>
        </span>
        <select value={currentLanguage} onChange={(event) => updateLanguage(event.target.value)}>
          <option value="ja">{t('language.ja')}</option>
          <option value="en">{t('language.en')}</option>
        </select>
      </label>
      <ToggleSetting
        label={t('settings.autoStart')}
        description={t('settings.autoStartDesc')}
        checked={settings.autoStartNext}
        onChange={(checked) => updateSetting('autoStartNext', checked)}
      />
      <ToggleSetting
        label={t('settings.sound')}
        description={t('settings.soundDesc')}
        checked={settings.soundEnabled}
        onChange={(checked) => updateSetting('soundEnabled', checked)}
      />
      <ToggleSetting
        label={t('settings.startSound')}
        description={t('settings.startSoundDesc')}
        checked={settings.startSoundEnabled}
        onChange={(checked) => updateSetting('startSoundEnabled', checked)}
      />
      <label className="setting-row">
        <span>
          {t('settings.volume')}
          <small>{Math.round(settings.volume * 100)}%</small>
        </span>
        <input
          className="range-input"
          min="0"
          max="1"
          step="0.05"
          type="range"
          value={settings.volume}
          onChange={(event) => updateSetting('volume', Number(event.target.value))}
        />
      </label>
      <label className="setting-row">
        <span>
          {t('settings.themeColor')}
          <small>{t('settings.themeColorDesc')}</small>
        </span>
        <input
          className="color-input"
          type="color"
          value={settings.themeColor}
          onChange={(event) => updateSetting('themeColor', event.target.value)}
        />
      </label>
      {isDeveloperPanelAvailable && (
        <>
          <ToggleSetting
            label={t('developer.mode')}
            description={t('developer.onlyDevelopment')}
            checked={settings.developerMode}
            onChange={(checked) => updateSetting('developerMode', checked)}
          />
          {settings.developerMode && (
            <DeveloperPanel
              gameState={gameState}
              setGameState={setGameState}
              backgroundState={backgroundState}
              backgroundPreview={backgroundPreview}
              setBackgroundPreview={setBackgroundPreview}
              effectiveGrowthLevel={effectiveGrowthLevel}
            />
          )}
        </>
      )}
    </section>
  );
}

function FirebaseSyncPanel({
  authUser,
  authStatus,
  authError,
  cloudSyncStatus,
  onSignIn,
  onSignUp,
  onSignOut,
  onManualCloudSync,
}) {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const busy = ['checking', 'signingIn', 'loadingCloud'].includes(authStatus);
  const signedIn = Boolean(authUser);

  async function submit(event, mode) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) return;
    if (mode === 'signUp') {
      await onSignUp(trimmedEmail, password);
    } else {
      await onSignIn(trimmedEmail, password);
    }
  }

  return (
    <section className="firebase-sync-panel">
      <div className="firebase-sync-heading">
        <span>
          <strong>{t('sync.title')}</strong>
          <small>{t(`sync.status.${authStatus}`)}</small>
        </span>
        {signedIn && <em>{t(`sync.cloudStatus.${cloudSyncStatus}`)}</em>}
      </div>

      {!isFirebaseConfigured && (
        <p className="sync-message">{t('sync.notConfigured')}</p>
      )}

      {isFirebaseConfigured && signedIn && (
        <div className="sync-account">
          <span>
            {t('sync.signedInAs')}
            <strong>{authUser.email}</strong>
          </span>
          <div className="sync-actions">
            <button type="button" className="secondary-button" onClick={onManualCloudSync}>
              {t('sync.syncNow')}
            </button>
            <button type="button" className="secondary-button" onClick={onSignOut}>
              {t('sync.signOut')}
            </button>
          </div>
        </div>
      )}

      {isFirebaseConfigured && !signedIn && (
        <form className="sync-form" onSubmit={(event) => submit(event, 'signIn')} noValidate>
          <label>
            <span>{t('sync.email')}</span>
            <input
              autoComplete="email"
              inputMode="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label>
            <span>{t('sync.password')}</span>
            <input
              autoComplete="current-password"
              minLength="6"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('sync.passwordHint')}
            />
          </label>
          <div className="sync-actions">
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? t('sync.working') : t('sync.signIn')}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={(event) => submit(event, 'signUp')}
            >
              {t('sync.signUp')}
            </button>
          </div>
        </form>
      )}

      {authError && <p className="sync-error">{authError}</p>}
    </section>
  );
}

function DeveloperPanel({
  gameState,
  setGameState,
  backgroundState,
  backgroundPreview,
  setBackgroundPreview,
  effectiveGrowthLevel,
}) {
  const { t } = useTranslation();

  function confirmAndRun(messageKey, action) {
    if (window.confirm(t(messageKey))) {
      setGameState(action(gameState));
    }
  }

  return (
    <section className="developer-panel">
      <div className="developer-heading">
        <h2>{t('developer.title')}</h2>
        <span>{t('developer.onlyDevelopment')}</span>
      </div>

      <div className="developer-section">
        <h3>{t('developer.addCookies')}</h3>
        <div className="developer-actions">
          <button type="button" className="secondary-button" onClick={() => setGameState(addCookiesForDebug(100, gameState))}>
            {t('developer.add100Cookies')}
          </button>
          <button type="button" className="secondary-button" onClick={() => setGameState(addCookiesForDebug(1000, gameState))}>
            {t('developer.add1000Cookies')}
          </button>
          <button type="button" className="secondary-button" onClick={() => setGameState(addCookiesForDebug(10000, gameState))}>
            {t('developer.add10000Cookies')}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => confirmAndRun('developer.confirmSetCookiesZero', resetCookiesForDebug)}
          >
            {t('developer.setCookiesZero')}
          </button>
        </div>
      </div>

      <div className="developer-section">
        <h3>{t('developer.timerDesignTools')}</h3>
        <div className="developer-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setGameState(unlockAllTimerDesignsForDebug(gameState))}
          >
            {t('developer.unlockAllTimerDesigns')}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => confirmAndRun('developer.confirmResetTimerDesigns', resetTimerDesignsForDebug)}
          >
            {t('developer.resetTimerDesigns')}
          </button>
        </div>
      </div>

      <div className="developer-section">
        <h3>{t('developer.gameStateTools')}</h3>
        <button
          type="button"
          className="danger-button"
          onClick={() => confirmAndRun('developer.confirmResetGameState', resetGameStateForDebug)}
        >
          {t('developer.resetGameState')}
        </button>
      </div>

      <div className="developer-section">
        <h3>Background Preview</h3>
        <div className="background-preview-control">
          <span>Level</span>
          <div className="background-preview-options" role="group" aria-label="Background growth preview">
            {backgroundPreviewLevels.map((level) => (
              <button
                key={level.id}
                type="button"
                className={
                  backgroundPreview.growthLevel === level.id
                    ? 'background-preview-chip active'
                    : 'background-preview-chip'
                }
                onClick={() =>
                  setBackgroundPreview((current) => ({ ...current, growthLevel: level.id }))
                }
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        <dl className="debug-state background-preview-state">
          <DebugRow label="previewGrowthLevel" value={backgroundPreview.growthLevel} />
          <DebugRow label="effectiveGrowthLevel" value={`Lv${effectiveGrowthLevel}`} />
          <DebugRow
            label="completedWorkSessions"
            value={backgroundState.completedWorkSessions}
          />
        </dl>
      </div>

      <div className="developer-section">
        <h3>{t('developer.debugState')}</h3>
        <dl className="debug-state">
          <DebugRow label={t('developer.state.cookies')} value={formatCookies(gameState.cookies)} />
          <DebugRow label={t('developer.state.totalCookiesEarned')} value={formatCookies(gameState.totalCookiesEarned)} />
          <DebugRow label={t('developer.state.currentStreak')} value={gameState.currentStreak} />
          <DebugRow label={t('developer.state.selectedTimerDesign')} value={gameState.selectedTimerDesign} />
          <DebugRow label={t('developer.state.ownedTimerDesigns')} value={JSON.stringify(gameState.ownedTimerDesigns)} />
          <DebugRow label={t('developer.state.purchasedItems')} value={JSON.stringify(gameState.purchasedItems)} />
          <DebugRow label={t('developer.state.purchasedUpgrades')} value={JSON.stringify(gameState.purchasedUpgrades)} />
        </dl>
      </div>
    </section>
  );
}

function DebugRow({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function NumberSetting({ label, value, onChange }) {
  const { t } = useTranslation();
  return (
    <label className="setting-row">
      <span>
        {label}
        <small>{t('settings.minutesUnit')}</small>
      </span>
      <input
        min="1"
        max="180"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="setting-row">
      <span>
        {label}
        <small>{description}</small>
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = window.__focusTimerRoot ?? createRoot(rootElement);
window.__focusTimerRoot = root;
root.render(<App />);
