import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'PHANTOM AI — Autonomous Personal Operating System',
  description: 'PHANTOM AI is an autonomous personal network operating system. Command missions, coordinate research, analyze data, and automate workflows.',
  keywords: ['AI', 'autonomous', 'research', 'automation', 'operating system'],
  openGraph: {
    title: 'PHANTOM AI',
    description: 'Autonomous Personal Network Operating System',
    type: 'website',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
