function FlipClockTimer({ secondsLeft, modeLabel, statusLabel }) {
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');

  return (
    <div className="flip-timer">
      <span className="timer-label">{modeLabel}</span>
      <div className="flip-clock" aria-label={`${minutes}:${seconds}`}>
        <FlipCard value={minutes} />
        <span className="flip-separator">:</span>
        <FlipCard value={seconds} />
      </div>
      <span className="timer-status">{statusLabel}</span>
    </div>
  );
}

function FlipCard({ value }) {
  return (
    <div className="flip-card">
      <span>{value}</span>
    </div>
  );
}

export default FlipClockTimer;
