import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const proxyHandler = withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/login");

    if (isPublicPage) {
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isPublicPage = req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/login");
        if (isPublicPage) return true;
        return !!token;
      },
    },
  }
);

export default proxyHandler;
export { proxyHandler as proxy };

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/absences/:path*",
    "/rattrapages/:path*",
    "/login",
    "/",
  ],
};
