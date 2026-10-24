"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  CornerDownLeft,
  Lightbulb,
  Route,
  Search,
} from "lucide-react";
import { searchCodebase, suggestedQuestions } from "@/lib/search";
import type { SearchResult } from "@/lib/types";
import { Modal } from "./modal";

export function SearchDialog({
  onClose,
  onResult,
}: {
  onClose: () => void;
  onResult: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchCodebase(query), [query]);
  return (
    <Modal
      title="Search the example codebase"
      onClose={onClose}
      className="search-modal"
    >
      <div className="search-input-wrap">
        <Search size={21} />
        <input
          autoFocus
          aria-label="Search codebase"
          placeholder="Search components or workflows"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            }
            if (event.key === "Enter" && results[active])
              onResult(results[active]);
          }}
        />
      </div>
      <div className="search-body">
        {query.trim() ? (
          results.length ? (
            <>
              <div className="section-label">Results</div>
              <div
                className="search-results"
                role="listbox"
                aria-label="Search results"
              >
                {results.map((result, i) => (
                  <button
                    role="option"
                    aria-selected={active === i}
                    key={`${result.type}-${result.id}`}
                    className={i === active ? "active" : ""}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => onResult(result)}
                  >
                    <span className="result-icon">
                      {result.type === "workflow" ? (
                        <Route size={18} />
                      ) : (
                        <ArrowDownLeft size={18} />
                      )}
                    </span>
                    <span>
                      <strong>{result.title}</strong>
                      <small>{result.description}</small>
                    </span>
                    <CornerDownLeft size={15} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="unsupported-search">
              <Search size={27} />
              <h3>No match</h3>
              <p>Try authentication, checkout, or database connections.</p>
              <button className="text-button" onClick={() => setQuery("")}>
                See example questions <ArrowRight size={14} />
              </button>
            </div>
          )
        ) : (
          <>
            <div className="section-label">Try a question</div>
            {suggestedQuestions.map((question) => (
              <button
                className="suggested-question"
                key={question}
                onClick={() => setQuery(question)}
              >
                <Lightbulb size={16} />
                <span>{question}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </>
        )}
      </div>
      <div className="search-footer">
        <span>
          <span className="status-dot" />
          Example search
        </span>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> navigate <kbd>↵</kbd> open
        </span>
      </div>
    </Modal>
  );
}
