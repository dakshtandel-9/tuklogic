import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'TUKLOGIC — The History of User Experience',
  description: 'Explore the history of user experience, from the dawn of humanity to the digital age.',
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
