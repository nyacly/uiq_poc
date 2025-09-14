import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Hub - Ugandan Community in Queensland',
  description: 'Connecting Ugandans in Queensland through community, business, events, and shared experiences.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}