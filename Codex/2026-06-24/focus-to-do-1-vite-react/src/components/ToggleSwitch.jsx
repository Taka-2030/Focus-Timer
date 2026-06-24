function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      className={`toggle-switch ${checked ? 'on' : ''}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export default ToggleSwitch;
