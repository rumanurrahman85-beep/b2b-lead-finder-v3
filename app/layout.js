import './globals.css';

export const metadata = {
  title: 'B2B Lead Finder Pro',
  description: 'Find business leads from directories and YouTube',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-surface-50 text-surface-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
