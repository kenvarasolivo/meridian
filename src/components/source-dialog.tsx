"use client";

import { useState } from "react";
import { Check, Copy, FileCode2, GitBranch } from "lucide-react";
import type { SourceFile } from "@/lib/types";
import { CodePreview } from "./code-preview";
import { Modal } from "./modal";

export function SourceDialog({
  file,
  onClose,
}: {
  file: SourceFile;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
    }
  }
  return (
    <Modal
      title={`Source file ${file.path}`}
      onClose={onClose}
      className="source-modal"
    >
      <div className="source-modal-header">
        <span className="source-file-icon">
          <FileCode2 size={22} />
        </span>
        <div>
          <span className="section-label">Acme Commerce / Source</span>
          <h2>{file.path}</h2>
        </div>
      </div>
      <p className="source-description">{file.description}</p>
      <div className="source-code-toolbar">
        <span>
          <span className="file-type-dot" />
          {file.language === "prisma" ? "Prisma schema" : "TypeScript"}
          <span className="source-line-count">
            {file.code.split("\n").length} lines
          </span>
        </span>
        <button className="text-button" onClick={() => void copy()}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <div className="source-code-scroll">
        <CodePreview file={file} />
      </div>
      <div className="source-modal-footer">
        <span>
          <GitBranch size={13} />
          main
        </span>
        <span role="status">
          {error
            ? "Copy unavailable. You can select and copy the code."
            : "Simplified example · for exploration"}
        </span>
      </div>
    </Modal>
  );
}
