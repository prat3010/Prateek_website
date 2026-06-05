import type { Metadata } from "next";
import { Bangers, Comic_Neue, JetBrains_Mono, Nosifer } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { cookies } from "next/headers";
import { Theme } from "@/context/ThemeContext";

const bangers = Bangers({
  weight: "400",
  variable: "--font-bangers",
  subsets: ["latin"],
  display: "swap",
});

const comicNeue = Comic_Neue({
  weight: ["400", "700"],
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
      className={`${bangers.variable} ${comicNeue.variable} ${jetbrainsMono.variable} ${nosifer.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var isNoir = ${initialTheme === 'noir'};
                  if (saved === 'noir') {
                    isNoir = true;
                    document.documentElement.setAttribute('data-theme', 'noir');
                  } else if (saved === 'light') {
                    isNoir = false;
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    if (!saved) {
                      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      isNoir = prefersDark;
                      document.documentElement.setAttribute('data-theme', prefersDark ? 'noir' : 'light');
                    }
                  }
                  
                  // Inject dynamic preload link for correct LCP Hero image
                  var link = document.createElement('link');
                  link.rel = 'preload';
                  link.as = 'image';
                  link.href = isNoir ? '/images/hero-noir.webp' : '/images/hero-illustration.webp';
                  document.head.appendChild(link);
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ClientLayout initialTheme={initialTheme}>{children}</ClientLayout>
      </body>
    </html>
  );
}
