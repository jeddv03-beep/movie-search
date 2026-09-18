import "./globals.css";

export const metadata = {
  title: "CineFree — Find Movies You Can Watch Legally",
  description: "Search movies and discover verified legal streaming availability by region.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
