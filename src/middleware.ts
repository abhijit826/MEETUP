import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isApi = request.nextUrl.pathname.startsWith("/api");

  // Handle CORS preflight (OPTIONS) for mobile network IP requests
  if (isApi && request.method === "OPTIONS") {
    const preflightHeaders = new Headers();
    preflightHeaders.set("Access-Control-Allow-Origin", origin || "*");
    preflightHeaders.set("Access-Control-Allow-Credentials", "true");
    preflightHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    preflightHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    return new NextResponse(null, { status: 200, headers: preflightHeaders });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (isApi && origin) {
    supabaseResponse.headers.set("Access-Control-Allow-Origin", origin);
    supabaseResponse.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Skip middleware redirect checks for OAuth callbacks, code parameters, or authenticated bypass
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.searchParams.has("code") ||
    request.nextUrl.searchParams.has("error") ||
    request.nextUrl.searchParams.has("authenticated")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check custom persistent session cookie
  const customSessionCookie = request.cookies.get("sm_user_session")?.value;
  const isAuthenticated = !!(user || customSessionCookie);

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";
  const isProtectedPage = request.nextUrl.pathname.startsWith("/home") || request.nextUrl.pathname.startsWith("/loveguru");

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isAuthenticated && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
