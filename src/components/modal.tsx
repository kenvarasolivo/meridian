"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
  children,
  title,
  onClose,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const items = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
    (
      root?.querySelector<HTMLElement>("input, textarea") ?? items()[0]
    )?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusable = items();
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${className}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="modal-close icon-button"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          <X size={19} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
