import type { NextRequest } from "next/server";
import { refreshSession } from "./app/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
