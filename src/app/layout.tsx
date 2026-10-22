import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "fridgemate 🧊 — your personalised smart fridge buddy",
  description: "Track your fridge pals in a 3D animated fridge, get recipes matched to your allergies, diet and calorie goals.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧊</text></svg>",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins selection:bg-[#FFE1EC] selection:text-[#C2456F]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
