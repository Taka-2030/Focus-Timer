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

function useAnimatedSeconds(secondsLeft, totalSeconds, isRunning, resetKey, onDebugFrame) {
  const [animatedSeconds, setAnimatedSeconds] = React.useState(secondsLeft);
  const frameRef = React.useRef(null);
  const displayedRef = React.useRef(secondsLeft);
  const endAtRef = React.useRef(null);

  const emitDebugFrame = React.useCallback(
    (displaySeconds, rafActive, timestamp = performance.now()) => {
      if (!onDebugFrame) return;
      const safeSeconds = Math.max(0, Math.min(totalSeconds, displaySeconds));
      const progress = totalSeconds > 0 ? 1 - safeSeconds / totalSeconds : 0;
      onDebugFrame({
        timestamp,
        rafActive,
        displayedSeconds: safeSeconds,
        displayedProgress: progress,
        progress,
        elapsedTime: Math.max(0, totalSeconds - safeSeconds),
        remainingTime: safeSeconds,
        totalTime: totalSeconds,
      });
    },
    [onDebugFrame, totalSeconds],
  );

  React.useEffect(() => {
    window.cancelAnimationFrame(frameRef.current);
    endAtRef.current = null;
    displayedRef.current = secondsLeft;
    setAnimatedSeconds(secondsLeft);
    emitDebugFrame(secondsLeft, false);
  }, [resetKey, totalSeconds]);

  React.useEffect(() => {
    if (secondsLeft > 0) return;
    window.cancelAnimationFrame(frameRef.current);
    endAtRef.current = null;
    displayedRef.current = 0;
    setAnimatedSeconds(0);
    emitDebugFrame(0, false);
  }, [secondsLeft, emitDebugFrame]);

  React.useEffect(() => {
    if (!isRunning) {
      window.cancelAnimationFrame(frameRef.current);
      endAtRef.current = null;
      emitDebugFrame(displayedRef.current, false);
      return undefined;
    }

    const startSeconds = Math.min(displayedRef.current, secondsLeft);
    endAtRef.current = performance.now() + startSeconds * 1000;

    function update(now) {
      const nextSeconds = Math.max(0, Math.min(totalSeconds, (endAtRef.current - now) / 1000));
      displayedRef.current = nextSeconds;
      setAnimatedSeconds(nextSeconds);
      emitDebugFrame(nextSeconds, true, now);

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
  onDebugFrame,
}) {
  const animatedSeconds = useAnimatedSeconds(
    secondsLeft,
    totalSeconds,
    isRunning,
    resetKey,
    onDebugFrame,
  );
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
