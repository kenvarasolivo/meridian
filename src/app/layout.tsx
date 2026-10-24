import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import "./clean-workspace.css";
import "./atlas.css";
import "./impact.css";

export const metadata: Metadata = {
  title: "Meridian — Complex code. Made clear.",
  description:
    "Find your way through a codebase. Explore connected components, follow real-world workflows, and go from the big picture to the source.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
