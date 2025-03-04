import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from './context/AuthContext';
import ApiUsageIndicator from './components/ApiUsageIndicator';
import ClientLayout from './components/ClientLayout';
import 'tldraw/tldraw.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'State of Innovation',
  description: 'Track earnings calls and company updates',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0a0a0a] text-white min-h-screen font-sans">
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
        <ApiUsageIndicator />
      </body>
    </html>
  );
}
