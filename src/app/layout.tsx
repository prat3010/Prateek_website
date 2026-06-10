import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Lora, JetBrains_Mono, Nosifer } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import { Theme } from "@/context/ThemeContext";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const nosifer = Nosifer({
  weight: "400",
  variable: "--font-nosifer",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prateeq.in"),
  title: "Prateeq Sharma | Portfolio",
  description:
    "Crafting Digital Worlds, One Panel at a Time — Portfolio of Prateeq Sharma, developer, designer, and storyteller.",
  keywords: ["portfolio", "web developer", "Prateeq Sharma", "Prateeq", "comic book", "azure", "watercolor", "illustration"],
  authors: [{ name: "Prateeq Sharma" }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Prateeq Sharma | Portfolio",
    description: "Crafting Digital Worlds, One Panel at a Time",
    type: "website",
    url: "https://prateeq.in",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Prateeq Sharma",
  "jobTitle": "Full Stack Developer & Designer",
  "url": "https://prateeq.in",
  "description": "Portfolio of Prateeq Sharma — developer, designer, and storyteller crafting high-performance web applications and interactive experiences.",
  "sameAs": [
    "https://github.com/prat3010",
    "https://linkedin.com/in/freshlimevodka",
    "https://x.com/3010prateek",
    "https://instagram.com/freshlimevodka"
  ],
  "knowsAbout": [
    "React",
    "Next.js",
    "Flutter",
    "Dart",
    "Python",
    "FastAPI",
    "Flask",
    "UI/UX Design",
    "AI Prototyping",
    "AI Agent Orchestration"
  ]
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const initialTheme: Theme = themeCookie === 'noir' || themeCookie === 'light' ? themeCookie : 'light';

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${playfairDisplay.variable} ${lora.variable} ${jetbrainsMono.variable} ${nosifer.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'noir') {
                    document.documentElement.setAttribute('data-theme', 'noir');
                  } else if (saved === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else if (!saved) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'noir' : 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script id="json-ld" type="application/ld+json" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ClientLayout initialTheme={initialTheme}>{children}</ClientLayout>
        <SpeedInsights />
      </body>
    </html>
  );
}
