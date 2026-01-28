import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecureChat - End-to-End Encrypted Messaging',
  description: 'A secure chat application with end-to-end encryption using AES-256-GCM and ECDH key exchange.',
  keywords: ['secure chat', 'encrypted messaging', 'e2e encryption', 'private messaging'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
