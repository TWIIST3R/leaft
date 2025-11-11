import { clerkMiddleware } from "@clerk/nextjs/server";

const publicRoutes = [
  "/",
  "/pricing",
  "/contact",
  "/resources",
  "/legal",
  "/privacy",
  "/sign-in(.*)",
  "/sign-up(.*)",
];

export default clerkMiddleware({
  publicRoutes,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
  ],
};

