import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware is intentionally minimal to allow guest access
// Users can use the app without authentication (localStorage mode)
// Authentication is optional for cloud sync features
export function middleware(request: NextRequest) {
  // Allow all requests through - no auth required
  // The app supports both authenticated (API) and guest (localStorage) modes
  return NextResponse.next();
}

export const config = {
  matcher: ["/classic/:path*", "/dashboard/:path*", "/review/:path*"],
};
