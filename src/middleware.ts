import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const isProtectedRoute = path.startsWith("/superadmin") || 
                             path.startsWith("/company-admin") || 
                             path.startsWith("/employee") ||
                             path.startsWith("/desktop");

    // If they are not logged in, but trying to access a protected route, send to login
    if (!token && isProtectedRoute) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based routing if they are logged in and hit the landing page
    if (path === "/" && token) {
      if (token.role === "SUPERADMIN") return NextResponse.redirect(new URL("/superadmin", req.url));
      if (token.role === "ADMIN") return NextResponse.redirect(new URL("/company-admin", req.url));
      if (token.role === "EMPLOYEE") return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect Superadmin routes
    if (path.startsWith("/superadmin") && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect Company Admin routes
    if (path.startsWith("/company-admin") && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Protect Employee routes
    if (path.startsWith("/employee") && token?.role !== "EMPLOYEE" && token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Return true always so the middleware function above handles the routing logic, 
      // allowing unauthenticated users to see the landing page (/).
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/superadmin/:path*",
    "/company-admin/:path*",
    "/employee/:path*",
    "/desktop/:path*",
  ],
};
