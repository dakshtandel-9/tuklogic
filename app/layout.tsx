import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'TUKLOGIC | IT Services & Staffing Solutions',
  description: 'IT services and staffing solutions for your business. TUKLOGIC delivers software development, AI, cloud, enterprise platforms, and IT and non-IT talent.',
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
