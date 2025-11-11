import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware((auth) => {
  auth().protect((request) => {
    if (request.isPublicRoute) return;
  });
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp)).*)",
    "/",
    "/pricing",
    "/contact",
    "/resources",
    "/legal",
    "/privacy",
    "/sign-in(.*)",
    "/sign-up(.*)",
  ],
};

