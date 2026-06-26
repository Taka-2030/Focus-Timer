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

function TimerRenderer({ timerDesignId, secondsLeft, totalSeconds, modeLabel, statusLabel, formatTime }) {
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const sharedProps = {
    secondsLeft,
    totalSeconds,
    progress,
    modeLabel,
    statusLabel,
    formattedTime: formatTime(secondsLeft),
  };

  if (timerDesignId === 'flip') return <FlipClockTimer {...sharedProps} />;
  if (timerDesignId === 'water') return <WaterTimer {...sharedProps} />;
  return <RingTimer {...sharedProps} />;
}

export default TimerRenderer;
