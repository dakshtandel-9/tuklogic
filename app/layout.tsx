import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'TUKLOGIC — IT Services & Staffing Solutions',
  description: 'IT solutions and skilled teams built around your goals. Explore TUKLOGIC’s cloud, AI, enterprise platform, development, and staffing services.',
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
