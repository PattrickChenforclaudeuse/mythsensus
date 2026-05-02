// ============================================================
//  middleware.ts â€” Session refresh + /portal auth guard
//  Runs on every matched request BEFORE the page renders.
//  IMPORTANT: Do not add code between createServerClient and
//  getUser â€” Supabase SSR requires the session cookie to be
//  refreshed in one atomic step.
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PORTAL_PATHS } from '@/lib/constants'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() must come directly after createServerClient
  const { data: { user } } = await supabase.auth.getUser()

  // Guard all portal routes â€” redirect unauthenticated users to landing
  const isPortal = request.nextUrl.pathname.startsWith(PORTAL_PATHS.ROOT)
  if (isPortal && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', '1')   // signals landing page to open auth modal
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// Only run middleware on portal routes (not static files or API routes)
export const config = {
  matcher: ['/portal/:path*'],
}

