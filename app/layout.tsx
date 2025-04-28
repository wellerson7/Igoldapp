// app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'
import Providers from './providers'

export const metadata = {
  title: 'iGold POS App',
  description: 'Ponto de Venda iGold',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
