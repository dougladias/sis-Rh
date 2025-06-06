import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ProtectedLayout from '@/components/auth/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Globoo RH',
  description: 'Sistema de Gestão de Recursos Humanos da Globoo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>        
          <ProtectedLayout>
            {children}
          </ProtectedLayout>        
      </body>
    </html>
  )
}