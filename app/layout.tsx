import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ConvexProviderWithClerk from "@/components/providers/convex-clerk"
import { ClerkProvider } from "@clerk/nextjs";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-headline",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Beauty App",
  description: "Booking app for the beauty industry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${plusJakarta.variable} ${manrope.variable} antialiased font-(family-name:--font-manrope)`}>
        <ClerkProvider>
          <ConvexProviderWithClerk>
            {children}
            <Toaster />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </body>
    </html>
  );
}
