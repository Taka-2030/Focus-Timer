import { getBackgroundClassName, getTimePeriod } from '../services/backgroundService';

function BackgroundLayer({ backgroundState, timePeriod = getTimePeriod() }) {
  return (
    <div
      className={getBackgroundClassName(backgroundState, timePeriod)}
      aria-hidden="true"
      data-background-theme={backgroundState.theme}
      data-background-period={timePeriod}
      data-background-growth-level={backgroundState.growthLevel}
    />
  );
}

export default BackgroundLayer;
