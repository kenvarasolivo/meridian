import type { Metadata } from "next";
import { UserFlows } from "@/components/user-flows";
import "./user-flows.css";

export const metadata: Metadata = { title: "User flows — Meridian" };

export default function UserFlowsPage() {
  return <div className="workspace-theme"><UserFlows /></div>;
}
