// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  // Redirect to /login when not authenticated
  pages: {
    signIn: '/login'
  },
  callbacks: {
    // Only allow if there’s a valid token
    authorized: ({ token }) => !!token
  }
})

export const config = {
  // Protect everything except NextAuth’s own routes, static files and /login
  matcher: [
    '/((?!api/auth|_next|static|favicon.ico|login).*)'
  ]
}
