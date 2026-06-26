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
  const shouldAutoStartRef = React.useRef(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const activeMode = modes[mode];
  const modeColor = mode === 'work' ? settings.themeColor : activeMode.color;

  React.useEffect(() => {
    saveAppData({ tasks, sessions, settings, gameState });
  }, [tasks, sessions, settings, gameState]);

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
    const newTask = {
      id: crypto.randomUUID(),
      title: task.title.trim(),
      estimate: Number(task.estimate),
      priority: task.priority,
      dueDate: task.dueDate,
      completed: false,
      completedPomodoros: 0,
      createdAt: new Date().toISOString(),
    };
    setTasks((current) => [newTask, ...current]);
    setSelectedTaskId(newTask.id);
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
      id: crypto.randomUUID(),
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
      setRewardToast({ id: crypto.randomUUID(), amount: reward });

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
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
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
            totalSeconds={minutesToSeconds(settings[modes[mode].settingsKey])}
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

function TasksView({ tasks, selectedTaskId, onAddTask, onUpdateTask, onDeleteTask, onSelectTask }) {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState({
    title: '',
    estimate: 4,
    priority: 'medium',
    dueDate: '',
  });

  function submitTask(event) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onAddTask(draft);
    setDraft({ title: '', estimate: 4, priority: 'medium', dueDate: '' });
  }

  return (
    <section className="view-stack">
      <form className="task-form" onSubmit={submitTask}>
        <label>
          {t('tasks.name')}
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder={t('tasks.placeholder')}
          />
        </label>
        <div className="form-grid">
          <label>
            {t('tasks.estimate')}
            <input
              min="1"
              type="number"
              value={draft.estimate}
              onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
            />
          </label>
          <label>
            {t('tasks.priority')}
            <select
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
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
            />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          {t('common.add')}
        </button>
      </form>

      <div className="task-list">
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

createRoot(document.getElementById('root')).render(<App />);
