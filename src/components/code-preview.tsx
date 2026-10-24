import type { SourceFile } from "@/lib/types";

function highlight(line: string) {
  const parts = line.split(
    /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\/\/.*$|\b(?:import|from|export|default|async|await|function|const|return|if|new|true|false|null|model|String|Int)\b)/g,
  );
  return parts.map((part, i) => (
    <span
      key={i}
      className={
        part.startsWith("//")
          ? "syntax-comment"
          : /^["']/.test(part)
            ? "syntax-string"
            : /^(import|from|export|default|async|await|function|const|return|if|new|true|false|null|model|String|Int)$/.test(
                  part,
                )
              ? "syntax-keyword"
              : undefined
      }
    >
      {part}
    </span>
  ));
}

export function CodePreview({
  file,
  limit,
}: {
  file: SourceFile;
  limit?: number;
}) {
  const lines = file.code.split("\n");
  return (
    <div className="code-preview">
      <pre aria-label={`Example source code from ${file.path}`}>
        <code>
          {lines.slice(0, limit ?? lines.length).map((line, i) => (
            <span className="code-line" key={i}>
              <span className="line-number" aria-hidden="true">
                {i + 1}
              </span>
              <span>{highlight(line)}</span>
            </span>
          ))}
        </code>
      </pre>
      {limit && lines.length > limit && (
        <div className="code-truncated">
          {lines.length - limit} more lines in this example
        </div>
      )}
    </div>
  );
}
