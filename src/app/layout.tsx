import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rose Coaching Academy | RCA",
  description:
    "Start your medical journey with Rose Coaching Academy. Explore medical courses, exam preparation and professional learning pathways."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
