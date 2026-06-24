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
} from 'lucide-react';
import ToggleSwitch from './components/ToggleSwitch';
import { loadAppData, saveAppData } from './services/storageService';
import './styles.css';

const navItems = [
  { id: 'tasks', label: 'タスク', icon: ListTodo },
  { id: 'timer', label: 'タイマー', icon: Clock3 },
  { id: 'stats', label: '統計', icon: BarChart3 },
  { id: 'settings', label: '設定', icon: Settings },
];

const modes = {
  work: { label: '作業', settingsKey: 'workMinutes', color: '#e85d55' },
  shortBreak: { label: '短い休憩', settingsKey: 'shortBreakMinutes', color: '#3aa879' },
  longBreak: { label: '長い休憩', settingsKey: 'longBreakMinutes', color: '#4d78d8' },
};

const statsTabs = [
  { id: 'numbers', label: '数値表示' },
  { id: 'bars', label: '棒グラフ' },
  { id: 'line', label: '時間推移' },
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

    return {
      key,
      label: formatDayLabel(date),
      minutes,
    };
  });
}

function App() {
  const initialData = React.useMemo(() => loadAppData(), []);
  const [activeView, setActiveView] = React.useState('tasks');
  const [tasks, setTasks] = React.useState(initialData.tasks);
  const [sessions, setSessions] = React.useState(initialData.sessions);
  const [settings, setSettings] = React.useState(initialData.settings);
  const [selectedTaskId, setSelectedTaskId] = React.useState('');
  const [mode, setMode] = React.useState('work');
  const [secondsLeft, setSecondsLeft] = React.useState(() =>
    minutesToSeconds(initialData.settings.workMinutes),
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [audioReady, setAudioReady] = React.useState(false);
  const shouldAutoStartRef = React.useRef(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const activeMode = modes[mode];
  const modeColor = mode === 'work' ? settings.themeColor : activeMode.color;

  React.useEffect(() => {
    saveAppData({ tasks, sessions, settings });
  }, [tasks, sessions, settings]);

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
  }, [isRunning, mode, selectedTaskId, settings]);

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
    if (selectedTaskId === taskId) {
      setSelectedTaskId('');
    }
  }

  function playSound(type, force = false) {
    if (!settings.soundEnabled || (!audioReady && !force)) return;

    const fileName = type === 'start' ? 'start.mp3' : 'finish.mp3';
    const audio = new Audio(`/sounds/${fileName}`);
    audio.volume = clampVolume(settings.volume);
    audio.play().catch(() => {
      playFallbackTone(type, settings.volume);
    });
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
    if (settings.soundEnabled && settings.startSoundEnabled) {
      playSound('start', true);
    }
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
    const minutes = Number(settings[modes[currentMode].settingsKey]);
    const session = {
      id: crypto.randomUUID(),
      taskId: currentMode === 'work' ? selectedTaskId : '',
      mode: currentMode,
      minutes,
      completedAt: new Date().toISOString(),
    };

    playSound('finish');
    setSessions((current) => [session, ...current]);

    if (currentMode === 'work' && selectedTaskId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === selectedTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task,
        ),
      );
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

  return (
    <div className="app" style={{ '--theme': settings.themeColor, '--mode-color': modeColor }}>
      <main className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Focus Pomodoro</p>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="focus-pill">
            <Clock3 size={18} />
            {selectedTask ? selectedTask.title : 'タスク未選択'}
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
          />
        )}

        {activeView === 'stats' && <StatsView tasks={tasks} sessions={sessions} />}

        {activeView === 'settings' && (
          <SettingsView settings={settings} setSettings={setSettings} resetTimer={resetTimer} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="メインナビゲーション">
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
          タスク名
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="例: 英単語を30個覚える"
          />
        </label>
        <div className="form-grid">
          <label>
            予定
            <input
              min="1"
              type="number"
              value={draft.estimate}
              onChange={(event) => setDraft({ ...draft, estimate: event.target.value })}
            />
          </label>
          <label>
            優先度
            <select
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: event.target.value })}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          <label>
            締切
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
            />
          </label>
        </div>
        <button className="primary-button" type="submit">
          <Plus size={18} />
          追加
        </button>
      </form>

      <div className="task-list">
        {tasks.length === 0 ? (
          <EmptyState title="まだタスクがありません" text="最初の作業を追加して始めましょう。" />
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
                aria-label="完了切り替え"
              >
                {task.completed && <Check size={16} />}
              </button>
              <button className="task-main" onClick={() => onSelectTask(task.id)} type="button">
                <span className="task-title">{task.title}</span>
                <span className="task-meta">
                  {task.completedPomodoros}/{task.estimate} ポモドーロ
                  {task.dueDate ? ` ・ ${task.dueDate}` : ''}
                </span>
              </button>
              <span className={`priority ${task.priority}`}>
                {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
              </span>
              <button
                className="icon-button"
                onClick={() => onDeleteTask(task.id)}
                type="button"
                aria-label="削除"
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
}) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const radius = 132;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <section className="timer-view">
      <div className="mode-tabs" role="tablist" aria-label="タイマーモード">
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
          <span className="timer-status">{isRunning ? '集中中' : '待機中'}</span>
        </div>
      </div>

      <label className="task-select">
        集中するタスク
        <select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
          <option value="">選択なし</option>
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
        {audioReady ? '音の準備完了' : '開始ボタン後に音が有効になります'}
      </div>

      <div className="timer-actions">
        <button className="primary-button large" onClick={isRunning ? pauseTimer : startTimer} type="button">
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? '一時停止' : '開始'}
        </button>
        <button className="secondary-button large" onClick={resetTimer} type="button">
          <RotateCcw size={20} />
          リセット
        </button>
      </div>
    </section>
  );
}

function StatsView({ tasks, sessions }) {
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
      <div className="stats-tabs" role="tablist" aria-label="統計表示タイプ">
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
          <StatCard label="今日の集中時間" value={todayMinutes} unit="分" />
          <StatCard label="今日の完了ポモドーロ" value={todayWorkSessions.length} unit="回" />
          <StatCard label="今週の集中時間" value={weekMinutes} unit="分" />
          <StatCard label="完了タスク数" value={completedTasks} unit="件" />
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
        <h2>過去7日間の集中時間</h2>
        <span>最大 {maxMinutes}分</span>
      </div>
      <div className="bar-chart" aria-label="過去7日間の集中時間棒グラフ">
        {data.map((item) => {
          const height = Math.max(4, (item.minutes / maxMinutes) * 100);
          return (
            <div className="bar-item" key={item.key}>
              <div className="bar-value">{item.minutes}分</div>
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
        <h2>時間推移</h2>
        <span>単位: 分</span>
      </div>
      <div className="line-chart-wrap" aria-label="過去7日間の集中時間折れ線グラフ">
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
        label="作業時間"
        value={settings.workMinutes}
        onChange={(value) => updateSetting('workMinutes', value)}
      />
      <NumberSetting
        label="短い休憩"
        value={settings.shortBreakMinutes}
        onChange={(value) => updateSetting('shortBreakMinutes', value)}
      />
      <NumberSetting
        label="長い休憩"
        value={settings.longBreakMinutes}
        onChange={(value) => updateSetting('longBreakMinutes', value)}
      />
      <ToggleSetting
        label="次のタイマーを自動で開始する"
        description="作業後は休憩へ、休憩後は作業へ自動で移ります"
        checked={settings.autoStartNext}
        onChange={(checked) => updateSetting('autoStartNext', checked)}
      />
      <ToggleSetting
        label="音を鳴らす"
        description="タイマー終了時の通知音"
        checked={settings.soundEnabled}
        onChange={(checked) => updateSetting('soundEnabled', checked)}
      />
      <ToggleSetting
        label="開始時の効果音"
        description="開始ボタンを押したときに短い音を鳴らします"
        checked={settings.startSoundEnabled}
        onChange={(checked) => updateSetting('startSoundEnabled', checked)}
      />
      <label className="setting-row">
        <span>
          音量
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
          テーマカラー
          <small>アプリ全体のアクセント色</small>
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
        <small>分単位</small>
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
