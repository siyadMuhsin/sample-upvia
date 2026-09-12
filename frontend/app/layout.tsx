import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'Upvia — University Employability & Career Intelligence Platform',
  description:
    'National platform unifying university cooperative training, curricula alignment, explainable matching, and longitudinal graduate tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&family=Cairo:wght@300;400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
