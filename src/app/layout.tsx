import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-heading",
    display: "swap",
});

export const metadata: Metadata = {
    title: "ARDIC SENTINEL — Capacity Intelligence Model",
    description: "Endüstriyel üretim hattı kapasite simülasyonu ve optimizasyon aracı. Ardic Distributed Intelligence Unit.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="tr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
