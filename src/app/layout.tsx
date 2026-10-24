import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { RoleProvider } from '@/components/layout/RoleContext';
import { ThemeProvider } from '@/components/theme/ThemeContext';
import { ThemeScript } from '@/components/theme/ThemeScript';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://giga-flow.vercel.app'),
  title: 'GigaFlow | Milestone-Based Escrow',
  description: 'Milestone escrow with evidence-based dispute resolution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-charcoal text-paper antialiased font-sans selection:bg-brand-base selection:text-charcoal min-h-screen">
        <ThemeProvider>
          <RoleProvider>
            {children}
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
