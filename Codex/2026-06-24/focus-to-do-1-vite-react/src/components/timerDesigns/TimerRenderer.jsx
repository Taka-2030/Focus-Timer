import React from 'react';
import RingTimer from './RingTimer';
import FlipClockTimer from './FlipClockTimer';
import WaterTimer from './WaterTimer';

export const TIMER_DESIGNS = [
  {
    id: 'ring',
    nameKey: 'timerDesign.ring.name',
    descriptionKey: 'timerDesign.ring.description',
    price: 0,
  },
  {
    id: 'flip',
    nameKey: 'timerDesign.flip.name',
    descriptionKey: 'timerDesign.flip.description',
    price: 300,
  },
  {
    id: 'water',
    nameKey: 'timerDesign.water.name',
    descriptionKey: 'timerDesign.water.description',
    price: 500,
  },
];

function useAnimatedSeconds(secondsLeft, totalSeconds, isRunning, resetKey) {
  const [animatedSeconds, setAnimatedSeconds] = React.useState(secondsLeft);
  const frameRef = React.useRef(null);
  const displayedRef = React.useRef(secondsLeft);

  React.useEffect(() => {
    window.cancelAnimationFrame(frameRef.current);
    displayedRef.current = secondsLeft;
    setAnimatedSeconds(secondsLeft);
  }, [resetKey, totalSeconds]);

  React.useEffect(() => {
    if (!isRunning) {
      window.cancelAnimationFrame(frameRef.current);
      return undefined;
    }

    const startedAt = performance.now();
    const baseSeconds = Math.min(displayedRef.current, secondsLeft);

    function update(now) {
      const elapsedSeconds = (now - startedAt) / 1000;
      const nextSeconds = Math.max(0, Math.min(totalSeconds, baseSeconds - elapsedSeconds));
      displayedRef.current = nextSeconds;
      setAnimatedSeconds(nextSeconds);

      if (nextSeconds > 0) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    }

    frameRef.current = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [isRunning, secondsLeft, totalSeconds]);

  return Math.max(0, Math.min(totalSeconds, animatedSeconds));
}

function TimerRenderer({
  timerDesignId,
  secondsLeft,
  totalSeconds,
  isRunning,
  resetKey,
  modeLabel,
  formatTime,
}) {
  const animatedSeconds = useAnimatedSeconds(secondsLeft, totalSeconds, isRunning, resetKey);
  const displaySeconds = Math.ceil(animatedSeconds);
  const progress = totalSeconds > 0 ? 1 - animatedSeconds / totalSeconds : 0;
  const sharedProps = {
    secondsLeft: displaySeconds,
    totalSeconds,
    progress,
    isRunning,
    modeLabel,
    formattedTime: formatTime(displaySeconds),
  };

  if (timerDesignId === 'flip') return <FlipClockTimer {...sharedProps} />;
  if (timerDesignId === 'water') return <WaterTimer {...sharedProps} />;
  return <RingTimer {...sharedProps} />;
}

export default TimerRenderer;
