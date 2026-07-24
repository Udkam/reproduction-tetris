import { useEffect, useId, useRef, type ReactNode } from 'react';
import { browserPlatform } from '../platform/browserPlatform';

interface ActionSheetProps {
  open: boolean;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'danger';
  dismissOnBackdropClick?: boolean;
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

const ACTION_BUTTONS = '.action-sheet__actions > button:not([disabled])';
const ARROW_NAVIGABLE = '[data-arrow-nav]:not([disabled])';

export function ActionSheet({
  open,
  title,
  description,
  tone = 'default',
  dismissOnBackdropClick = false,
  onCancel,
  onConfirm,
  children,
}: ActionSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);

  const syncSelectedAction = (target: EventTarget | null) => {
    const panel = panelRef.current;
    const actions = panel ? [...panel.querySelectorAll<HTMLButtonElement>(ACTION_BUTTONS)] : [];
    if (actions.length !== 2) return;
    const index = actions.indexOf(target as HTMLButtonElement);
    if (index < 0) return;
    actions.forEach((action, actionIndex) => {
      if (actionIndex === index) action.dataset.actionSelected = 'true';
      else delete action.dataset.actionSelected;
    });
  };

  const syncArrowSelection = (target: EventTarget | null) => {
    const panel = panelRef.current;
    const controls = panel ? [...panel.querySelectorAll<HTMLButtonElement>(ARROW_NAVIGABLE)] : [];
    const index = controls.indexOf(target as HTMLButtonElement);
    if (index < 0) return;
    controls.forEach((control, controlIndex) => {
      if (controlIndex === index) control.dataset.arrowSelected = 'true';
      else delete control.dataset.arrowSelected;
    });
  };

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = browserPlatform.activeElement();
    const panel = panelRef.current;
    const focusInitial = () => {
      const preferred = panel?.querySelector<HTMLElement>('[data-autofocus]');
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      const target = preferred ?? first ?? panel;
      target?.focus({ preventScroll: true });
      syncSelectedAction(target);
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
      const actionButtons = [...panel?.querySelectorAll<HTMLButtonElement>(ACTION_BUTTONS) ?? []];
      if ((keyboardEvent.key === 'ArrowLeft' || keyboardEvent.key === 'ArrowRight') && actionButtons.length === 2) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        const currentIndex = actionButtons.findIndex((action) => action.dataset.actionSelected === 'true');
        const direction = keyboardEvent.key === 'ArrowLeft' ? -1 : 1;
        const nextIndex = (Math.max(currentIndex, 0) + direction + actionButtons.length) % actionButtons.length;
        const next = actionButtons[nextIndex]!;
        next.focus({ preventScroll: true });
        syncSelectedAction(next);
        return;
      }
      const arrowControls = [...panel?.querySelectorAll<HTMLButtonElement>(ARROW_NAVIGABLE) ?? []];
      const activeElement = browserPlatform.activeElement();
      const focusedRange = activeElement instanceof HTMLInputElement && activeElement.type === 'range';
      if (
        !focusedRange
        && arrowControls.length > 0
        && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(keyboardEvent.key)
      ) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        const selectedIndex = arrowControls.findIndex((control) => control.dataset.arrowSelected === 'true');
        const focusedIndex = arrowControls.indexOf(activeElement as HTMLButtonElement);
        const currentIndex = selectedIndex >= 0 ? selectedIndex : Math.max(focusedIndex, 0);
        const offset = keyboardEvent.key === 'ArrowLeft' ? -1
          : keyboardEvent.key === 'ArrowRight' ? 1
            : keyboardEvent.key === 'ArrowUp' ? -2 : 2;
        const nextIndex = (currentIndex + offset + arrowControls.length) % arrowControls.length;
        const next = arrowControls[nextIndex]!;
        next.focus({ preventScroll: true });
        syncArrowSelection(next);
        return;
      }
      if (keyboardEvent.key === 'Enter' && !keyboardEvent.isComposing && actionButtons.length === 2) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        const selected = actionButtons.find((action) => action.dataset.actionSelected === 'true') ?? actionButtons[0]!;
        selected.click();
        return;
      }
      if (!focusedRange && keyboardEvent.key === 'Enter' && !keyboardEvent.isComposing && arrowControls.length > 0) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        const selected = arrowControls.find((control) => control.dataset.arrowSelected === 'true') ?? arrowControls[0]!;
        selected.click();
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
    <div
      className="sheet-backdrop"
      data-testid="action-sheet-backdrop"
      onClick={(event) => {
        if (dismissOnBackdropClick && event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section
        ref={panelRef}
        className={`action-sheet action-sheet--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onFocusCapture={(event) => {
          syncSelectedAction(event.target);
          syncArrowSelection(event.target);
        }}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="action-sheet__actions">{children}</div>
      </section>
    </div>
  );
}
