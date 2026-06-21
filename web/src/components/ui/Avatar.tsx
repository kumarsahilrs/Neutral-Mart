interface AvatarProps {
  initials?: string;
  src?: string;
  size?: number;
  light?: boolean;
}

export default function Avatar({ initials = '?', src, size = 42, light }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        className="object-cover flex-shrink-0"
        style={{ width: size, height: size, borderRadius: 999 }}
      />
    );
  }
  return (
    <span
      className="disp flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: light ? 'rgba(255,255,255,.16)' : 'var(--nm-gold-soft)',
        color: light ? '#fff' : 'var(--nm-gold)',
        fontWeight: 800,
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </span>
  );
}
