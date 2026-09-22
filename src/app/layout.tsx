import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EstoquePro - Gestão Mobile",
  description: "Controle de estoque e vendas com rapidez",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-[100dvh] antialiased`}>
      <body className="min-h-[100dvh] flex flex-col bg-background text-foreground">
        <StoreProvider>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
