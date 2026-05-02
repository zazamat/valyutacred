import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "VaBank",
  description: "Kredit marketplace və müraciət platforması",
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}