import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ToastContext';
import SwRegister from '@/components/SwRegister';

export const metadata: Metadata = {
  title: 'DYFI Padanolsavam | Meenara Unit',
  description: 'DYFI Padanolsavam - Meenara Unit Management App',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Padanolsavam',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#7f1d1d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">
        <ToastProvider>
          <SwRegister />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
