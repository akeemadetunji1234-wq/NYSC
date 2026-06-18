import "../styles/index.css";

export const metadata = {
  title: "CampStay - Booking app wireframe",
  description: "Enables NYSC members to find and filter apartments by budget, location, and amenities, connecting them with verified agents for seamless bookings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
