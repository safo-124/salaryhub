import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
    const isLoggedIn = !!req.auth;
    const isLoginPage = req.nextUrl.pathname === "/login";
    const isApiRoute = req.nextUrl.pathname.startsWith("/api/v1");
    const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isSuperAdmin = req.auth?.user?.isSuperAdmin === true;
    const isImpersonating = req.auth?.user?.impersonating === true;

    // Let API routes and auth routes pass through
    if (isApiRoute || isAuthRoute) return NextResponse.next();

    // Redirect logged-in users away from login page
    if (isLoginPage && isLoggedIn) {
        const dest = isSuperAdmin && !isImpersonating ? "/admin" : "/";
        return NextResponse.redirect(new URL(dest, req.url));
    }

    // Redirect unauthenticated users to login
    if (!isLoginPage && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect admin routes — only super admins can access
    if (isAdminRoute && !isSuperAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    // Prevent super admins from accessing tenant dashboard (unless impersonating)
    if (!isAdminRoute && !isLoginPage && isSuperAdmin && !isImpersonating) {
        return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
