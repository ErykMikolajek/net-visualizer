import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
   title: "Network Visualizer",
   description: "Visualize your neural network",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en">
         <body>{children}</body>
      </html>
   );
}
