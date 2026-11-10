import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from 'next/font/google';
import { CrmProvider } from '@/components/crm-provider';
import { Sidebar } from '@/components/sidebar';
import './globals.css';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Public_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'CRM Casa da Charque',
  description: 'Gestão de clientes, funil de vendas e metas da Casa da Charque, CEASA Recife.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="app">
          <Sidebar />
          <main id="main">
            <CrmProvider>
              <div className="view">{children}</div>
            </CrmProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
