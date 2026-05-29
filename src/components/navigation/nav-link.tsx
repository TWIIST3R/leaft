"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useNavLoading } from "@/components/navigation/route-change-loader";

export function NavLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const { startNavigation } = useNavLoading();

  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) startNavigation();
      }}
    />
  );
}
