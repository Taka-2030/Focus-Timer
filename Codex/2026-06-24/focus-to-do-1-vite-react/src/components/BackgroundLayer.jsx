import { getBackgroundClassName } from '../services/backgroundService';

function BackgroundLayer({ backgroundState, growthLevel = null }) {
  const effectiveGrowthLevel = growthLevel ?? backgroundState.growthLevel;

  return (
    <div
      className={getBackgroundClassName(backgroundState, effectiveGrowthLevel)}
      aria-hidden="true"
      data-background-theme={backgroundState.theme}
      data-background-growth-level={effectiveGrowthLevel}
    >
      <span className="background-horizon" />
      <span className="background-bloom" />
      <span className="background-texture" />
    </div>
  );
}

export default BackgroundLayer;
