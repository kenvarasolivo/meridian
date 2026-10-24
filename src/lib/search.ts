import { components } from "@/data/application";
import { workflows } from "@/data/workflows";
import type { SearchResult } from "./types";

export const suggestedQuestions = [
  "Where is authentication handled?",
  "How does checkout work?",
  "What connects to the database?",
];

export function searchCodebase(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  if (
    /database|postgres|prisma/.test(q) &&
    /connect|depend|what|read|write/.test(q)
  ) {
    return [
      {
        type: "connections",
        id: "database",
        title: "What connects to the database?",
        description: "Trace API, Authentication, and Background Jobs.",
      },
    ];
  }
  const results: SearchResult[] = [];
  const workflowId = /checkout|order|cart|purchase|buy/.test(q)
    ? "checkout"
    : /login|log in|sign.?in/.test(q)
      ? "login"
      : /notif|email|receipt|sent|send/.test(q)
        ? "notification"
        : null;
  if (workflowId) {
    const workflow = workflows.find((w) => w.id === workflowId)!;
    results.push({
      type: "workflow",
      id: workflow.id,
      title: workflow.question,
      description: `${workflow.steps.length} steps · ${workflow.description}`,
    });
  }
  const aliases: Record<string, string[]> = {
    auth: ["auth", "identity", "password", "protected"],
    api: ["api", "endpoint", "route", "request"],
    frontend: ["frontend", "interface", "react", "page", "ui"],
    database: ["database", "prisma", "postgres", "schema", "data"],
    payments: ["payment", "stripe"],
    jobs: ["background", "job", "worker", "inngest"],
    notifications: ["notification", "resend", "email"],
  };
  const matched = new Set(
    Object.entries(aliases)
      .filter(([, words]) => words.some((w) => q.includes(w)))
      .map(([id]) => id),
  );
  for (const component of components) {
    if (
      matched.has(component.id) ||
      component.name.toLowerCase().includes(q) ||
      component.files.some((f) => f.path.toLowerCase().includes(q))
    ) {
      results.push({
        type: "component",
        id: component.id,
        title: component.name,
        description: component.description,
      });
    }
  }
  return results.slice(0, 6);
}
