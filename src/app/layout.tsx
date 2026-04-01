import type { Metadata } from 'next';
import '@/styles/globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'COESS Networks — Interactive Networking Lab',
  description: 'A gamified, module-based networking education platform. Practice subnetting, VLSM, build topologies, and simulate network commands — all in the browser.',
  keywords: ['networking', 'subnetting', 'VLSM', 'CCNA', 'topology builder', 'network simulator', 'OSI model'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <div className="main-area">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
