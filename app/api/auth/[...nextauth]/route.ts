import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Sua lista de vendedores e códigos de 4 dígitos
const sellers = [
  { id: '1', name: 'Alice', code: '1234' },
  { id: '2', name: 'Bruno', code: '4321' },
  // adicione mais conforme necessário
]

export const authOptions: NextAuthOptions = {
  // Vamos usar JWT para a sessão
  session: { strategy: 'jwt' },

  // Provider de credenciais — só o PIN de 4 dígitos
  providers: [
    CredentialsProvider({
      name: 'Código de Acesso',
      credentials: {
        code: { label: 'PIN de 4 dígitos', type: 'text', placeholder: '1234' }
      },
      async authorize(credentials) {
        if (!credentials?.code) return null
        const seller = sellers.find(s => s.code === credentials.code.trim())
        if (!seller) return null
        // devolvemos um objeto user sem a senha
        return {
          id: seller.id,
          name: seller.name,
          email: `${seller.id}@igold.local`
        }
      }
    })
  ],

  // Página customizada de login (PIN pad)
  pages: {
    signIn: '/login'
  },

  callbacks: {
    // Iguala o token ao usuário no primeiro login
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.name = user.name
      }
      return token
    },
    // Exponha id e name no objeto session.user
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id   = token.id as string
        session.user.name = token.name as string
      }
      return session
    }
  },

  // Deve ser a mesma que você colocou no .env.local
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }