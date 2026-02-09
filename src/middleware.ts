import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Not signed in → let them through (your page can show landing/login)
  if (!token) return NextResponse.next();

  // If disabled, optionally send somewhere else
  if (token.disabled) {
    const url = req.nextUrl.clone();
    url.pathname = "/disabled"; // create this page or remove this block
    return NextResponse.redirect(url);
  }

  // New users: force them into setup
  const isNew = Boolean(token.newAccount);

  // If token says they're new, verify with the server (DB) in case token is stale.
  // This avoids a redirect loop where the DB was updated but the JWT still contains the old flag.
  if (isNew && pathname !== "/setup") {
    try {
      // Call a small internal API that returns the current DB value for newAccount.
      // Ensure cookies are forwarded so the server can authenticate the user.
      const statusUrl = new URL("/api/user/new-account-status", req.url);
      const statusRes = await fetch(statusUrl.toString(), {
        headers: { cookie: req.headers.get("cookie") || "" },
        cache: "no-store",
      });

      if (statusRes.ok) {
        const json = await statusRes.json();
        // If DB says user is no longer new, allow the request through.
        if (json && json.newAccount === false) {
          return NextResponse.next();
        }
      }
    } catch (err) {
      // If anything fails, fall back to redirecting to setup to be safe.
      // (We avoid throwing from middleware.)
      console.error("middleware: failed to verify newAccount status", err);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};