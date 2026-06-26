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
  const endAtRef = React.useRef(null);

  React.useEffect(() => {
    window.cancelAnimationFrame(frameRef.current);
    endAtRef.current = null;
    displayedRef.current = secondsLeft;
    setAnimatedSeconds(secondsLeft);
  }, [resetKey, totalSeconds]);

  React.useEffect(() => {
    if (!isRunning) {
      window.cancelAnimationFrame(frameRef.current);
      endAtRef.current = null;
      return undefined;
    }

    const startSeconds = Math.min(displayedRef.current, secondsLeft);
    endAtRef.current = performance.now() + startSeconds * 1000;

    function update(now) {
      const nextSeconds = Math.max(0, Math.min(totalSeconds, (endAtRef.current - now) / 1000));
      displayedRef.current = nextSeconds;
      setAnimatedSeconds(nextSeconds);

      if (nextSeconds > 0) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    }

    frameRef.current = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameRef.current);
  }, [isRunning, totalSeconds]);

  return Math.max(0, Math.min(totalSeconds, animatedSeconds));
}

function TimerRenderer({
  timerDesignId,
  secondsLeft,
  totalSeconds,
  isRunning,
  resetKey,
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
    formattedTime: formatTime(displaySeconds),
  };

  if (timerDesignId === 'flip') return <FlipClockTimer {...sharedProps} />;
  if (timerDesignId === 'water') return <WaterTimer {...sharedProps} />;
  return <RingTimer {...sharedProps} />;
}

export default TimerRenderer;
