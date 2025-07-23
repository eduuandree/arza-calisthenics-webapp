import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARZA - Entrenamiento Personalizado",
  description: "Descubre tu potencial con rutinas personalizadas, evaluación técnica y progresión real. El sistema ARZA te lleva de principiante a avanzado con ciencia y método.",
  icons: {
    icon: [
      { url: '/arza-logo.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/arza-logo.svg', sizes: '48x48', type: 'image/svg+xml' },
      { url: '/arza-logo.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/arza-logo.svg', sizes: '16x16', type: 'image/svg+xml' },
    ],
    shortcut: '/arza-logo.svg',
    apple: [
      { url: '/arza-logo.svg', sizes: '180x180', type: 'image/svg+xml' },
      { url: '/arza-logo.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/arza-logo.svg', sizes: '120x120', type: 'image/svg+xml' },
    ],
    other: [
      { rel: 'mask-icon', url: '/arza-logo.svg', color: '#21372b' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/arza-logo.svg" sizes="any" />
        <link rel="icon" href="/arza-logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/arza-logo.svg" sizes="48x48" />
        <link rel="icon" href="/arza-logo.svg" sizes="32x32" />
        <link rel="icon" href="/arza-logo.svg" sizes="16x16" />
        <link rel="shortcut icon" href="/arza-logo.svg" />
        <link rel="apple-touch-icon" href="/arza-logo.svg" sizes="180x180" />
        <link rel="apple-touch-icon" href="/arza-logo.svg" sizes="152x152" />
        <link rel="apple-touch-icon" href="/arza-logo.svg" sizes="120x120" />
        <meta name="theme-color" content="#21372b" />
        <meta name="msapplication-TileColor" content="#21372b" />
        <meta name="msapplication-TileImage" content="/arza-logo.svg" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
