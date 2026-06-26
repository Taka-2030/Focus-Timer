function WaterTimer({ progress, formattedTime }) {
  const waterLevel = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className="water-timer">
      <div className="water-vessel">
        <div className="water-fill" style={{ height: `${waterLevel}%` }}>
          <span className="water-wave wave-one" />
          <span className="water-wave wave-two" />
          <span className="water-wave wave-three" />
        </div>
        <div className="water-shine" />
        <div className="water-content">
          <strong>{formattedTime}</strong>
        </div>
      </div>
    </div>
  );
}

export default WaterTimer;
