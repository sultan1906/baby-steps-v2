import type { Metadata, Viewport } from "next";
import { Noto_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#f06292",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Baby Steps",
  description: "Capture every milestone of your baby's first year",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Baby Steps",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={notoSans.variable}>
      <body className="antialiased font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
