import type { Metadata } from "next";
import { Explorer } from "@/components/explorer";

export const metadata: Metadata = {
  title: "Explore Acme Commerce — Meridian",
};

export default function ExplorePage() {
  return (
    <div className="workspace-theme">
      <Explorer />
    </div>
  );
}
