export type ExplanationLevel = "beginner" | "developer";
export type ViewMode = "map" | "architecture" | "domain";
export type NavigationItem = "Overview" | "Explore" | "Workflows" | "Diagrams";
export type ComponentKind =
  | "frontend"
  | "api"
  | "auth"
  | "database"
  | "payments"
  | "notifications"
  | "jobs";

export interface SourceFile {
  path: string;
  language: "typescript" | "prisma";
  description: string;
  code: string;
}

export interface CodeComponent {
  id: string;
  name: string;
  description: string;
  kind: ComponentKind;
  type: string;
  technology: string;
  purpose: Record<ExplanationLevel, string>;
  files: SourceFile[];
  functions: string[];
  parentId?: string;
  children?: string[];
}

export interface CodeRelationship {
  id: string;
  source: string;
  target: string;
  label: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowStep {
  title: string;
  componentId: string;
  explanation: Record<ExplanationLevel, string>;
  file: SourceFile;
}

export interface Workflow {
  id: string;
  name: string;
  question: string;
  description: string;
  duration: string;
  steps: WorkflowStep[];
  relationshipIds: string[];
}

export interface DomainEntity extends CodeComponent {
  fields: {
    name: string;
    type: string;
    primary?: boolean;
    foreign?: boolean;
  }[];
}

export type SearchResult =
  | { type: "workflow"; id: string; title: string; description: string }
  | { type: "component"; id: string; title: string; description: string }
  | { type: "connections"; id: string; title: string; description: string };
