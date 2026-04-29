import type { Metadata } from "next";
import localFont from "next/font/local";
import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// Montserrat — shipped locally in docs/designsystem/fonts/
const montserrat = localFont({
  src: [
    {
      path: "../fonts/Montserrat-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../fonts/Montserrat-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Barlow Condensed — display/heading font (not in local files, fetched at build time)
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// JetBrains Mono — code/VIN/RO numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panda Tech",
  description: "Shop management for small mechanic shops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
