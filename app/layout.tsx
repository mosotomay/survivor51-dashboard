import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans, Poppins } from "next/font/google";
import { asset } from "@/lib/model";
import "./globals.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// Numbers use Poppins (the same face the Sleeper app uses for scores); it reads more clearly than the condensed display face.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the live origin so link previews use absolute image URLs.
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: "Survivor 51 Fantasy League",
  description: "Standings, teams, weekly scores, draft board and rules for our Survivor 51 fantasy league.",
  robots: { index: false, follow: false },
  appleWebApp: { title: "Survivor 51" },
  openGraph: {
    title: "Survivor 51 Fantasy League",
    description: "Who's winning? Standings update every Thursday.",
    images: [asset("/headshots/brady.jpg")],
  },
};

export const viewport: Viewport = {
  themeColor: "#15120f",
};

// Applies the saved theme before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem('s51-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className={`${barlow.variable} ${dmSans.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
