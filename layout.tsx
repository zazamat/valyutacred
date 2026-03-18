export const metadata = {
  title: "ValyutaCred",
  description: "Kredit müraciət sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az">
      <body>{children}</body>
    </html>
  );
}
