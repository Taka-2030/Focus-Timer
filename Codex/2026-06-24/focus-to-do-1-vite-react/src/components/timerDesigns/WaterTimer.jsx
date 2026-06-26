function WaterTimer({ progress, modeLabel, statusLabel, formattedTime }) {
  const waterLevel = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className="water-timer">
      <div className="water-vessel">
        <div className="water-fill" style={{ height: `${waterLevel}%` }} />
        <div className="water-shine" />
        <div className="water-content">
          <span className="timer-label">{modeLabel}</span>
          <strong>{formattedTime}</strong>
          <span className="timer-status">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default WaterTimer;
