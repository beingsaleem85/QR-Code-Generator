interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, avatarUrl, size = 56 }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external/user-uploaded avatar URLs; Module 3.8 revisits with next/image + a configured remote pattern.
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      <span className="font-medium">{getInitials(name)}</span>
    </div>
  );
}
