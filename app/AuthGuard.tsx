'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    // Redireciona para /login se o usuário não estiver autenticado e não estiver na página de login
    if (status === 'unauthenticated' && path !== '/login') {
      router.replace('/login');
    }
  }, [status, path, router]);

  // Enquanto a sessão está carregando, exibe uma tela de carregamento
  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Carregando…</p>
      </div>
    );
  }

  // Sempre permite renderizar a página de login
  if (path === '/login') {
    return <>{children}</>;
  }

  // Se o status for "unauthenticated", aguarda o redirecionamento (evita loops)
  if (status === 'unauthenticated') {
    return null;
  }

  // Se o status for "authenticated", renderiza o conteúdo protegido
  return <>{children}</>;
}