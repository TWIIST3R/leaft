import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/contact",
    "/resources",
    "/legal",
    "/privacy",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
  ignoredRoutes: ["/api/(.*)"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)"],
};

