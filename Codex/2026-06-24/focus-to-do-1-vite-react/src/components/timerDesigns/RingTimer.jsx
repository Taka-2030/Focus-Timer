function RingTimer({ secondsLeft, totalSeconds, modeLabel, formattedTime }) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const radius = 132;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="timer-ring">
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
        <span className="timer-label">{modeLabel}</span>
        <strong>{formattedTime}</strong>
      </div>
    </div>
  );
}

export default RingTimer;
