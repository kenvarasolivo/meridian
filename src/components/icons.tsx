import {
  Bell,
  Blocks,
  CreditCard,
  Database,
  Globe2,
  KeyRound,
  Layers3,
  Network,
  Route,
  Server,
  ShoppingBag,
  Workflow,
  Zap,
} from "lucide-react";
import type { ComponentKind } from "@/lib/types";

export const componentIcons: Record<ComponentKind, typeof Globe2> = {
  frontend: Globe2,
  api: Layers3,
  auth: KeyRound,
  database: Database,
  payments: CreditCard,
  notifications: Bell,
  jobs: Workflow,
};
export const workflowIcons: Record<string, typeof Globe2> = {
  login: KeyRound,
  checkout: ShoppingBag,
  notification: Bell,
};
export const navigationIcons = {
  Overview: Blocks,
  Explore: Network,
  Workflows: Route,
  Diagrams: Server,
};

export function MeridianMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="13.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <ellipse
        cx="18"
        cy="18"
        rx="6.2"
        ry="13.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 18h27M7 10.5h22M7 25.5h22"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle
        cx="26.8"
        cy="8"
        r="3.2"
        fill="var(--accent)"
        stroke="var(--sidebar)"
        strokeWidth="2"
      />
    </svg>
  );
}

export { Zap };
