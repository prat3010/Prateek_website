import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Playfair_Display, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Theme } from "@/context/ThemeContext";
import { getProfile, getSkills } from "@/lib/data";

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
    siteName: "Prateeq Sharma Portfolio",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Prateeq Sharma Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prateeq Sharma | Portfolio",
    description: "Crafting Digital Worlds, One Panel at a Time",
    creator: "@3010prateek",
    images: ["/opengraph-image.png"],
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const initialTheme: Theme = themeCookie === 'noir' || themeCookie === 'light' ? themeCookie : 'light';

  // Fetch dynamic profile and skills details for structured SEO data (JSON-LD)
  const [profile, skills] = await Promise.all([
    getProfile(),
    getSkills()
  ]);

  const sameAs: string[] = [];
  if (profile) {
    if (profile.github) sameAs.push(profile.github);
    if (profile.linkedin) sameAs.push(profile.linkedin);
    if (profile.twitter) sameAs.push(profile.twitter);
    if (profile.instagram) sameAs.push(profile.instagram);
  }

  const defaultSameAs = [
    "https://github.com/prat3010",
    "https://linkedin.com/in/freshlimevodka",
    "https://x.com/3010prateek",
    "https://instagram.com/freshlimevodka"
  ];
  defaultSameAs.forEach(link => {
    if (!sameAs.includes(link)) {
      sameAs.push(link);
    }
  });

  const knowsAbout = skills && skills.length > 0
    ? skills.map(s => s.name)
    : [
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
      ];

  const dynamicJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile?.name || "Prateek Sharma",
    "jobTitle": profile?.title || "Full Stack Developer & Designer",
    "url": "https://prateeq.in",
    "description": profile?.summary?.general || "Portfolio of Prateek Sharma — developer, designer, and storyteller crafting high-performance web applications and interactive experiences.",
    "sameAs": sameAs,
    "knowsAbout": knowsAbout
  };

  return (
    <html
      lang="en"
      data-theme={initialTheme}
      className={`${playfairDisplay.variable} ${lora.variable} ${jetbrainsMono.variable}`}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicJsonLd) }}
        />

      </head>
      <body>
        <ClientLayout initialTheme={initialTheme}>{children}</ClientLayout>
        <SpeedInsights />
      </body>
    </html>
  );
}
