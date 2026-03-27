import "./globals.css";
export const metadata = {
  title: "ValyutaCred",
  description: "Kredit müraciət sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
