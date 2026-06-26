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
  resetCookiesForDebug,
  resetGameStateForDebug,
  resetTimerDesignsForDebug,
  saveAppData,
  unlockAllTimerDesignsForDebug,
} from './services/storageService';
import { getProductionDebugMode } from './services/debugModeService';
import {
  getBackgroundClassName,
  getTimePeriod,
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

const statsTabs = [
  { id: 'numbers', labelKey: 'stats.numbers' },
  { id: 'bars', labelKey: 'stats.bars' },
  { id: 'line', labelKey: 'stats.line' },
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

function calculateCookieReward(minutes, gameState, completedAt = new Date()) {
  const baseReward = Number(minutes) * 0.4;
  const itemBonus = getItemBonus(gameState.purchasedItems);
  let reward = baseReward + itemBonus;
  let multiplier = 1;
  const nextStreak = gameState.currentStreak + 1;

  if (hasUpgrade(gameState, 'focusBoost1')) multiplier += 0.1;
  if (hasUpgrade(gameState, 'morningBoost') && completedAt.getHours() < 12) multiplier += 0.2;
  if (hasUpgrade(gameState, 'streakBonus') && nextStreak % 3 === 0) multiplier += 0.3;

  reward *= multiplier;
  return Math.max(0, Math.round(reward * 10) / 10);
}

function getActiveBoostDetails(gameState, date = new Date()) {
  const boosts = [];
  if (hasUpgrade(gameState, 'focusBoost1')) {
    boosts.push({ id: 'focusBoost1', labelKey: 'shop.focusBoost1', icon: '✨', percent: 10 });
  }
  if (hasUpgrade(gameState, 'morningBoost') && date.getHours() < 12) {
    boosts.push({ id: 'morningBoost', labelKey: 'shop.morningBoost', icon: '🌅', percent: 20 });
  }
  if (hasUpgrade(gameState, 'streakBonus') && (gameState.currentStreak + 1) % 3 === 0) {
    boosts.push({ id: 'streakBonus', labelKey: 'shop.streakBonus', icon: '🔥', percent: 30 });
  }
  return boosts;
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
  const [currentTimePeriod, setCurrentTimePeriod] = React.useState(() => getTimePeriod());
  const shouldAutoStartRef = React.useRef(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const activeMode = modes[mode];
  const modeColor = mode === 'work' ? settings.themeColor : activeMode.color;
  const currentTotalSeconds = minutesToSeconds(settings[modes[mode].settingsKey]);
  const backgroundClassName = getBackgroundClassName(backgroundState, currentTimePeriod);

  const handleTimerDebugFrame = React.useCallback(
    (frame) => {
      if (!isProductionDebugEnabled) return;
      setTimerDebugFrame(frame);
    },
    [isProductionDebugEnabled],
  );

  React.useEffect(() => {
    saveAppData({ tasks, sessions, settings, gameState, backgroundState });
  }, [tasks, sessions, settings, gameState, backgroundState]);

  React.useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  React.useEffect(() => {
    const id = window.setInterval(() => setCurrentTimePeriod(getTimePeriod()), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

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
      const reward = calculateCookieReward(minutes, gameState, completedAt);
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

  return (
    <div
      className={`app view-${activeView} ${
        isFullscreen ? `focus-fullscreen fullscreen-design-${gameState.selectedTimerDesign}` : ''
      }`}
      style={{ '--theme': settings.themeColor, '--mode-color': modeColor }}
    >
      <BackgroundLayer backgroundState={backgroundState} timePeriod={currentTimePeriod} />
      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t('app.name')}</p>
            <h1>{t(navItems.find((item) => item.id === activeView)?.labelKey)}</h1>
          </div>
          <div className="focus-pill cookie-pill">
            🍪 {formatCookies(gameState.cookies)} {t('app.cookies')}
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
          />
        )}

        {activeView === 'timer' && (
          <TimerView
            tasks={tasks}
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
            onBuyItem={buyItem}
            onBuyUpgrade={buyUpgrade}
            onBuyTimerDesign={buyTimerDesign}
            onSelectTimerDesign={selectTimerDesign}
          />
        )}

        {activeView === 'stats' && <StatsView tasks={tasks} sessions={sessions} gameState={gameState} />}

        {activeView === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            resetTimer={resetTimer}
            currentLanguage={i18n.language}
            gameState={gameState}
            setGameState={setGameState}
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
          timePeriod={currentTimePeriod}
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
  timePeriod,
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
            <ProductionDebugRow label="timePeriod" value={timePeriod} />
            <ProductionDebugRow label="growthLevel" value={backgroundState.growthLevel} />
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
    if (import.meta.env.DEV) {
      setTaskDebug((current) => withAfterRender(current));
    }
  }, [tasks.length, onTaskDebug]);

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
    if (!import.meta.env.DEV) return;
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
        {import.meta.env.DEV && taskDebug && (
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
  const activeBoosts = getActiveBoostDetails(gameState);
  const totalBoostPercent = getTotalBoostPercent(activeBoosts);
  const boostChipLabel =
    activeBoosts.length > 1
      ? `✨ ${t('boost.total', { percent: totalBoostPercent })}`
      : activeBoosts.length === 1
        ? `${activeBoosts[0].icon} ${t(activeBoosts[0].labelKey)} +${activeBoosts[0].percent}%`
        : `✨ ${t('boost.none')}`;

  return (
    <section className={`timer-view timer-design-${timerDesignId}`}>
      <button className="fullscreen-button" type="button" onClick={toggleFullscreen}>
        {isFullscreen ? t('focus.exitFullscreen') : t('timer.fullscreen')}
      </button>
      <div className="timer-compact-info">
        <div className="mini-cookie-pill" aria-label={t('cookies.label')}>
          {'\uD83C\uDF6A'} {formatCookies(gameState.cookies)}
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
      </div>
      <div className="focus-context">
        <span>{selectedTask ? selectedTask.title : t('app.noTask')}</span>
      </div>
      {rewardToast && (
        <div className="reward-toast" key={rewardToast.id}>
          {t('timer.reward', { amount: formatCookies(rewardToast.amount) })}
        </div>
      )}

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

      <TimerRenderer
        timerDesignId={timerDesignId}
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        isRunning={isRunning}
        resetKey={timerAnimationResetKey}
        formatTime={formatTime}
        onDebugFrame={onTimerDebugFrame}
      />

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

      <div className="sound-note">
        <Volume2 size={17} />
        {audioReady ? t('timer.soundReady') : t('timer.soundLocked')}
      </div>

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
    </section>
  );
}

function ShopView({ gameState, onBuyItem, onBuyUpgrade, onBuyTimerDesign, onSelectTimerDesign }) {
  const { t } = useTranslation();
  return (
    <section className="view-stack">
      <div className="shop-summary">
        <span>{t('common.totalEarned')}</span>
        <strong>{formatCookies(gameState.totalCookiesEarned)}</strong>
      </div>

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
                  <span>{t('common.price')}: 🍪 {item.price.toLocaleString()}</span>
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
                  <span>{t('common.price')}: 🍪 {upgrade.price.toLocaleString()}</span>
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
                  <span>{t('common.price')}: 🍪 {design.price.toLocaleString()}</span>
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
    </section>
  );
}

function TimerDesignPreview({ designId }) {
  return (
    <div className={`timer-design-preview preview-${designId}`} aria-hidden="true">
      {designId === 'flip' && (
        <div className="preview-flip">
          <span>25</span>
          <span>00</span>
        </div>
      )}
      {designId === 'water' && (
        <div className="preview-water">
          <span />
        </div>
      )}
      {designId === 'ring' && (
        <div className="preview-ring">
          <span />
        </div>
      )}
    </div>
  );
}

function StatsView({ tasks, sessions, gameState }) {
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
      {activeTab === 'line' && <LineStatsChart data={sevenDayData} />}
    </section>
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

function LineStatsChart({ data }) {
  const { t } = useTranslation();
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 60);
  const points = data.map((item, index) => {
    const x = 24 + index * 42;
    const y = 176 - (item.minutes / maxMinutes) * 136;
    return { ...item, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <article className="chart-card">
      <div className="chart-heading">
        <h2>{t('stats.focusTrend')}</h2>
        <span>{t('common.unit')}: {t('common.minutes')}</span>
      </div>
      <div className="line-chart-wrap" aria-label={t('stats.focusTrend')}>
        <svg className="line-chart" viewBox="0 0 300 220" role="img">
          <line className="axis-line" x1="24" y1="176" x2="276" y2="176" />
          <line className="axis-line" x1="24" y1="40" x2="24" y2="176" />
          <polyline className="line-path" points={polyline} />
          {points.map((point) => (
            <g key={point.key}>
              <circle className="line-dot" cx={point.x} cy={point.y} r="4.5" />
              <text className="line-value" x={point.x} y={point.y - 10}>
                {point.minutes}
              </text>
              <text className="line-label" x={point.x} y="202">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </article>
  );
}

function SettingsView({ settings, setSettings, resetTimer, currentLanguage, gameState, setGameState }) {
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
            <DeveloperPanel gameState={gameState} setGameState={setGameState} />
          )}
        </>
      )}
    </section>
  );
}

function DeveloperPanel({ gameState, setGameState }) {
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
