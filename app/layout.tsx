import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ConvexProviderWithClerk from "@/components/providers/convex-clerk"
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
    <html lang="en">
      <body className={`${dmSans.variable} antialiased font-(family-name:--font-dm-sans)`}>
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
