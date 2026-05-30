import type { Metadata } from "next";
import { Bangers, Comic_Neue, JetBrains_Mono, Creepster, Nosifer } from "next/font/google";
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

const creepster = Creepster({
  weight: "400",
  variable: "--font-creepster",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Prateek Sharma",
  "jobTitle": "Full Stack Developer & Designer",
  "url": "https://prateeq.in",
  "description": "Portfolio of Prateek Sharma — developer, designer, and storyteller crafting high-performance web applications and interactive experiences.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bangers.variable} ${comicNeue.variable} ${jetbrainsMono.variable} ${creepster.variable} ${nosifer.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'noir') {
                    document.documentElement.setAttribute('data-theme', 'noir');
                  } else if (saved === 'light') {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'noir' : 'light');
                  }
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
