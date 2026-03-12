"use client";

import Image from "next/image";

const SIZE_MAP: Record<string, number> = { sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({
  firstName,
  lastName,
  avatarUrl,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const px = SIZE_MAP[size];
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fontSize = px < 40 ? "text-xs" : px < 56 ? "text-sm" : "text-base";

  if (avatarUrl) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: px, height: px }}
      >
        <Image
          src={avatarUrl}
          alt={`${firstName} ${lastName}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/15 font-semibold text-[var(--brand)] ${fontSize}`}
      style={{ width: px, height: px }}
    >
      {initials}
    </span>
  );
}
