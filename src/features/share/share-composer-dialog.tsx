"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export function ShareComposerDialog({
  actions,
  children,
  className = "",
  description,
  onClose,
  preview,
  title,
}: {
  actions: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: string;
  onClose: () => void;
  preview: ReactNode;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    ref.current?.showModal();
    return () => triggerRef.current?.focus();
  }, []);

  return (
    <dialog
      aria-label={title}
      className={`share-composer ${className}`.trim()}
      data-qa="share-composer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={ref}
    >
      <header className="share-composer__header">
        <div>
          <p className="eyebrow">Share</p>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button
          aria-label="Close share composer"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="share-composer__preview">{preview}</div>
      <div className="share-composer__controls">{children}</div>
      <footer className="share-composer__footer">
        <p>Names and scores stay on this device until you share them.</p>
        {actions}
      </footer>
    </dialog>
  );
}
