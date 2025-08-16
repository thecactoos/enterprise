import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '../lib/react-query-provider';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Enterprise CRM - System Zarządzania Relacjami z Klientami',
  description: 'Nowoczesny system CRM dla przedsiębiorstw. Zarządzanie kontaktami, produktami, ofertami i fakturami.',
  keywords: 'CRM, zarządzanie, kontakty, faktury, oferty, przedsiębiorstwo',
  authors: [{ name: 'Enterprise CRM Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Enterprise CRM',
    description: 'System Zarządzania Relacjami z Klientami',
    type: 'website',
    locale: 'pl_PL',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <ReactQueryProvider>
          <Providers>
            {children}
          </Providers>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
