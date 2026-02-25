import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtOnEdge } from "./lib/jwt-edge";

const authRoutes = ["/dashboard", "/datasets", "/admin", "/chat"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const user = await verifyJwtOnEdge(token);
  if (!user) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.cookies.delete("token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/datasets/:path*", "/admin/:path*", "/chat/:path*"],
};

