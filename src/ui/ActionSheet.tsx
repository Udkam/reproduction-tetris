import { useEffect, useId, useRef, type ReactNode } from 'react';
import { browserPlatform } from '../platform/browserPlatform';

interface ActionSheetProps {
  open: boolean;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'danger';
  onCancel?: () => void;
  onConfirm?: () => void;
  children: ReactNode;
}

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function ActionSheet({
  open,
  title,
  description,
  tone = 'default',
  onCancel,
  onConfirm,
  children,
}: ActionSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = browserPlatform.activeElement();
    const panel = panelRef.current;
    const focusInitial = () => {
      const preferred = panel?.querySelector<HTMLElement>('[data-autofocus]');
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (preferred ?? first ?? panel)?.focus({ preventScroll: true });
    };
    const frame = browserPlatform.defer(focusInitial);

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape' && onCancel) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        onCancel();
        return;
      }
      if (keyboardEvent.key === 'Enter' && onConfirm && !keyboardEvent.isComposing) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        onConfirm();
        return;
      }
      if (keyboardEvent.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) {
        keyboardEvent.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (keyboardEvent.shiftKey && browserPlatform.activeElement() === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && browserPlatform.activeElement() === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    const removeKeyDown = browserPlatform.listenDocument('keydown', handleKeyDown, true);
    return () => {
      browserPlatform.cancelFrame(frame);
      removeKeyDown();
      browserPlatform.defer(() => {
        browserPlatform.deferFocus(previouslyFocused);
      });
    };
  }, [onCancel, onConfirm, open]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" data-testid="action-sheet-backdrop">
      <section
        ref={panelRef}
        className={`action-sheet action-sheet--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="action-sheet__actions">{children}</div>
      </section>
    </div>
  );
}
