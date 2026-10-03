import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { RoleProvider } from '@/components/layout/RoleContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export const metadata: Metadata = {
  title: 'GigaFlow | Milestone-Based Escrow',
  description: 'Milestone escrow with evidence-based dispute resolution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-charcoal text-paper antialiased font-sans selection:bg-brand-base selection:text-charcoal min-h-screen">
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
