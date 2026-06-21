interface ToggleProps {
  on: boolean;
  onChange?: (on: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ on, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className="relative inline-block flex-shrink-0"
      style={{
        width: 40,
        height: 23,
        borderRadius: 999,
        background: on ? 'var(--nm-green)' : '#d8cfbd',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2.5,
          left: on ? 19.5 : 2.5,
          width: 18,
          height: 18,
          borderRadius: 999,
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}
