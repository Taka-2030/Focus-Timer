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
import { loadAppData, saveAppData } from './services/storageService';
import './styles.css';

const shopItems = [
  { id: 'pencil', name: 'Pencil', price: 10, bonus: 1 },
  { id: 'notebook', name: 'Notebook', price: 50, bonus: 5 },
  { id: 'library', name: 'Library', price: 300, bonus: 20 },
  { id: 'lab', name: 'Lab', price: 1000, bonus: 80 },
  { id: 'aiAssistant', name: 'AI Assistant', price: 5000, bonus: 300 },
];

const shopUpgrades = [
  {
    id: 'focusBoost1',
    name: 'Focus Boost Lv.1',
    price: 100,
    effect: 'All work rewards +10%',
  },
  {
    id: 'streakBonus',
    name: 'Streak Bonus',
    price: 250,
    effect: 'Every 3-work-session streak gives +30%',
  },
  {
    id: 'morningBoost',
    name: 'Morning Boost',
    price: 500,
    effect: 'Morning work rewards +20%',
  },
];

const navItems = [
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'timer', label: 'Timer', icon: Clock3 },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const modes = {
  work: { label: 'Work', settingsKey: 'workMinutes', color: '#e85d55' },
  shortBreak: { label: 'Short Break', settingsKey: 'shortBreakMinutes', color: '#3aa879' },
  longBreak: { label: 'Long Break', settingsKey: 'longBreakMinutes', color: '#4d78d8' },
};

const statsTabs = [
  { id: 'numbers', label: 'Numbers' },
  { id: 'bars', label: 'Bars' },
  { id: 'line', label: 'Trend' },
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
  const shouldAutoStartRef = React.useRef(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const activeMode = modes[mode];
  const modeColor = mode === 'work' ? settings.themeColor : activeMode.color;

  React.useEffect(() => {
    saveAppData({ tasks, sessions, settings, gameState });
  }, [tasks, sessions, settings, gameState]);

  React.useEffect(() => {
    if (!rewardToast) return undefined;
    const id = window.setTimeout(() => setRewardToast(null), 1600);
    return () => window.clearTimeout(id);
  }, [rewardToast]);

  React.useEffect(() => {
    setSecondsLeft(minutesToSeconds(settings[modes[mode].settingsKey]));
    setIsRunning(shouldAutoStartRef.current);
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

  return (
    <div className="app" style={{ '--theme': settings.themeColor, '--mode-color': modeColor }}>
      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Focus Pomodoro</p>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="focus-pill cookie-pill">🍪 {formatCookies(gameState.cookies)} Cookies</div>
          <div className="focus-pill">
            <Clock3 size={18} />
            {selectedTask ? selectedTask.title : 'No task selected'}
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
            gameState={gameState}
            rewardToast={rewardToast}
          />
        )}

        {activeView === 'shop' && (
          <ShopView gameState={gameState} onBuyItem={buyItem} onBuyUpgrade={buyUpgrade} />
        )}

        {activeView === 'stats' && <StatsView tasks={tasks} sessions={sessions} gameState={gameState} />}

        {activeView === 'settings' && (
          <SettingsView settings={settings} setSettings={setSettings} resetTimer={resetTimer} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
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
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TasksView({ tasks, selectedTaskId, onAddTask, onUpdateTask, onDeleteTask, onSelectTask }) {
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
          Task name
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Example: Review vocabulary"
          />
        </label>
        <div className="form-grid">
          <label>
            Estimate
            <input
              min="1"
              type="number"
              value={draft.estimate}
              onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
            />
          </label>
          <label>
            Priority
            <select
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
            />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          Add
        </button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" text="Add your first focus task." />
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
                aria-label="Toggle complete"
              >
                {task.completed && <Check size={16} />}
              </button>
              <button className="task-main" onClick={() => onSelectTask(task.id)} type="button">
                <span className="task-title">{task.title}</span>
                <span className="task-meta">
                  {task.completedPomodoros}/{task.estimate} pomodoros
                  {task.dueDate ? ` ・ ${task.dueDate}` : ''}
                </span>
              </button>
              <span className={`priority ${task.priority}`}>{task.priority}</span>
              <button
                className="icon-button"
                onClick={() => onDeleteTask(task.id)}
                type="button"
                aria-label="Delete"
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
  gameState,
  rewardToast,
}) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const radius = 132;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <section className="timer-view">
      <div className="cookie-bank">🍪 {formatCookies(gameState.cookies)} Cookies</div>
      {rewardToast && (
        <div className="reward-toast" key={rewardToast.id}>
          +{formatCookies(rewardToast.amount)} cookies
        </div>
      )}

      <div className="mode-tabs" role="tablist" aria-label="Timer mode">
        {Object.entries(modes).map(([key, item]) => (
          <button
            key={key}
            className={mode === key ? 'active' : ''}
            onClick={() => setMode(key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`timer-ring ${mode}`}>
        <svg viewBox="0 0 320 320" aria-hidden="true">
          <circle className="ring-track" cx="160" cy="160" r={radius} />
          <circle
            className="ring-progress"
            cx="160"
            cy="160"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>
        <div className="timer-face">
          <span className="timer-label">{modes[mode].label}</span>
          <strong>{formatTime(secondsLeft)}</strong>
          <span className="timer-status">{isRunning ? 'Focusing' : 'Ready'}</span>
        </div>
      </div>

      <label className="task-select">
        Focus task
        <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
          <option value="">No task selected</option>
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
        {audioReady ? 'Sound ready' : 'Sound unlocks after pressing Start'}
      </div>

      <div className="timer-actions">
        <button className="primary-button large" onClick={isRunning ? pauseTimer : startTimer} type="button">
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="secondary-button large" onClick={resetTimer} type="button">
          <RotateCcw size={20} />
          Reset
        </button>
      </div>
    </section>
  );
}

function ShopView({ gameState, onBuyItem, onBuyUpgrade }) {
  return (
    <section className="view-stack">
      <div className="shop-summary">
        <span>Cookies</span>
        <strong>🍪 {formatCookies(gameState.cookies)}</strong>
        <small>Total earned: {formatCookies(gameState.totalCookiesEarned)}</small>
      </div>

      <div className="shop-section">
        <h2>Facilities</h2>
        <div className="shop-grid">
          {shopItems.map((item) => {
            const count = Number(gameState.purchasedItems[item.id] || 0);
            const canBuy = gameState.cookies >= item.price;
            return (
              <article className="shop-card" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>+{item.bonus} cookie on each completed work timer</p>
                </div>
                <div className="shop-meta">
                  <span>Price: 🍪 {item.price.toLocaleString()}</span>
                  <span>Owned: {count}</span>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canBuy}
                  onClick={() => onBuyItem(item)}
                >
                  Buy
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="shop-section">
        <h2>Upgrades</h2>
        <div className="shop-grid">
          {shopUpgrades.map((upgrade) => {
            const purchased = hasUpgrade(gameState, upgrade.id);
            const canBuy = gameState.cookies >= upgrade.price && !purchased;
            return (
              <article className={`shop-card ${purchased ? 'purchased' : ''}`} key={upgrade.id}>
                <div>
                  <h3>{upgrade.name}</h3>
                  <p>{upgrade.effect}</p>
                </div>
                <div className="shop-meta">
                  <span>Price: 🍪 {upgrade.price.toLocaleString()}</span>
                  <span>{purchased ? 'Purchased' : 'One time'}</span>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canBuy}
                  onClick={() => onBuyUpgrade(upgrade)}
                >
                  {purchased ? 'Purchased' : 'Buy'}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StatsView({ tasks, sessions, gameState }) {
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
      <div className="stats-tabs" role="tablist" aria-label="Stats view type">
        {statsTabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'numbers' && (
        <div className="stats-grid">
          <StatCard label="Today's focus" value={todayMinutes} unit="min" />
          <StatCard label="Today's pomodoros" value={todayWorkSessions.length} unit="times" />
          <StatCard label="This week's focus" value={weekMinutes} unit="min" />
          <StatCard label="Completed tasks" value={completedTasks} unit="tasks" />
          <StatCard label="Total Cookies" value={formatCookies(gameState.totalCookiesEarned)} unit="" />
          <StatCard label="Current streak" value={gameState.currentStreak} unit="work" />
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
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 60);

  return (
    <article className="chart-card">
      <div className="chart-heading">
        <h2>Last 7 days focus</h2>
        <span>Max {maxMinutes} min</span>
      </div>
      <div className="bar-chart" aria-label="Last 7 days focus bar chart">
        {data.map((item) => {
          const height = Math.max(4, (item.minutes / maxMinutes) * 100);
          return (
            <div className="bar-item" key={item.key}>
              <div className="bar-value">{item.minutes}m</div>
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
        <h2>Focus trend</h2>
        <span>Unit: min</span>
      </div>
      <div className="line-chart-wrap" aria-label="Last 7 days focus line chart">
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

function SettingsView({ settings, setSettings, resetTimer }) {
  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    resetTimer();
  }

  return (
    <section className="settings-panel">
      <NumberSetting
        label="Work time"
        value={settings.workMinutes}
        onChange={(value) => updateSetting('workMinutes', value)}
      />
      <NumberSetting
        label="Short break"
        value={settings.shortBreakMinutes}
        onChange={(value) => updateSetting('shortBreakMinutes', value)}
      />
      <NumberSetting
        label="Long break"
        value={settings.longBreakMinutes}
        onChange={(value) => updateSetting('longBreakMinutes', value)}
      />
      <ToggleSetting
        label="Auto-start next timer"
        description="Move from work to break and back automatically"
        checked={settings.autoStartNext}
        onChange={(checked) => updateSetting('autoStartNext', checked)}
      />
      <ToggleSetting
        label="Sound"
        description="Play a sound when the timer finishes"
        checked={settings.soundEnabled}
        onChange={(checked) => updateSetting('soundEnabled', checked)}
      />
      <ToggleSetting
        label="Start sound"
        description="Play a short sound when starting"
        checked={settings.startSoundEnabled}
        onChange={(checked) => updateSetting('startSoundEnabled', checked)}
      />
      <label className="setting-row">
        <span>
          Volume
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
          Theme color
          <small>Accent color for the app</small>
        </span>
        <input
          className="color-input"
          type="color"
          value={settings.themeColor}
          onChange={(event) => updateSetting('themeColor', event.target.value)}
        />
      </label>
    </section>
  );
}

function NumberSetting({ label, value, onChange }) {
  return (
    <label className="setting-row">
      <span>
        {label}
        <small>Minutes</small>
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
