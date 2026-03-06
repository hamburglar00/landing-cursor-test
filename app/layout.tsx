import "./globals.css";

// Todo el app dinámico: evita que el build en Vercel intente pre-renderizar y llame a Supabase
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
