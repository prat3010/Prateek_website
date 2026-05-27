import type { Metadata } from "next";
import { Bangers, Comic_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const bangers = Bangers({
  weight: "400",
  variable: "--font-bangers",
  subsets: ["latin"],
  display: "swap",
});

const comicNeue = Comic_Neue({
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-comic-neue",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prateek Sharma | Portfolio",
  description:
    "Crafting Digital Worlds, One Panel at a Time — Portfolio of Prateek Sharma, developer, designer, and storyteller.",
  keywords: ["portfolio", "web developer", "Prateek Sharma", "comic book", "pop art"],
  authors: [{ name: "Prateek Sharma" }],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Prateek Sharma | Portfolio",
    description: "Crafting Digital Worlds, One Panel at a Time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${comicNeue.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
