import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Lista de vendedores e códigos
const sellers = [
  { id: '1', name: 'Alice', code: '1234' },
  { id: '2', name: 'Bruno', code: '4321' },
  // adicione mais conforme necessário
];

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Código de Acesso',
      credentials: {
        code: { label: 'PIN de 4 dígitos', type: 'text', placeholder: '1234' },
      },
      async authorize(credentials) {
        if (!credentials?.code) return null;
        const seller = sellers.find((s) => s.code === credentials.code.trim());
        if (!seller) return null;
        return {
          id: seller.id,
          name: seller.name,
          email: `${seller.id}@igold.local`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// CORRETO: exportando o handler como GET e POST
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
