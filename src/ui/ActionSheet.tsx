import { useEffect, useId, useRef, type ReactNode } from 'react';
import { browserPlatform } from '../platform/browserPlatform';

interface ActionSheetProps {
  open: boolean;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'danger';
  className?: string;
  placement?: 'viewport' | 'gameplay';
  externalFocusSelector?: string;
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
  className,
  placement = 'viewport',
  externalFocusSelector,
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
        const coordinates = arrowControls.map((control, index) => {
          const rowValue = control.dataset.arrowRow;
          const columnValue = control.dataset.arrowCol;
          const row = rowValue === undefined ? Number.NaN : Number(rowValue);
          const column = columnValue === undefined ? Number.NaN : Number(columnValue);
          return { control, index, row, column };
        });
        const hasCoordinateLayout = coordinates.every(({ row, column }) => Number.isInteger(row) && Number.isInteger(column));
        let next: HTMLButtonElement;

        if (hasCoordinateLayout) {
          const current = coordinates[currentIndex]!;
          if (keyboardEvent.key === 'ArrowLeft' || keyboardEvent.key === 'ArrowRight') {
            const sameRow = coordinates
              .filter(({ row }) => row === current.row)
              .sort((left, right) => left.column - right.column || left.index - right.index);
            const rowIndex = sameRow.findIndex(({ control }) => control === current.control);
            const direction = keyboardEvent.key === 'ArrowLeft' ? -1 : 1;
            next = sameRow[(rowIndex + direction + sameRow.length) % sameRow.length]!.control;
          } else {
            const rows = [...new Set(coordinates.map(({ row }) => row))].sort((left, right) => left - right);
            const rowIndex = rows.indexOf(current.row);
            const direction = keyboardEvent.key === 'ArrowUp' ? -1 : 1;
            const targetRow = rows[(rowIndex + direction + rows.length) % rows.length]!;
            next = coordinates
              .filter(({ row }) => row === targetRow)
              .sort((left, right) => (
                Math.abs(left.column - current.column) - Math.abs(right.column - current.column)
                || left.column - right.column
                || left.index - right.index
              ))[0]!.control;
          }
        } else {
          const offset = keyboardEvent.key === 'ArrowLeft' ? -1
            : keyboardEvent.key === 'ArrowRight' ? 1
              : keyboardEvent.key === 'ArrowUp' ? -2 : 2;
          const nextIndex = (currentIndex + offset + arrowControls.length) % arrowControls.length;
          next = arrowControls[nextIndex]!;
        }

        next.focus({ preventScroll: true });
        syncArrowSelection(next);
        if (next.dataset.arrowActivateOnFocus === 'true') next.click();
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
      const panelFocusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const externalFocusable = externalFocusSelector
        ? [...browserPlatform.documentTarget()?.querySelectorAll<HTMLElement>(externalFocusSelector) ?? []]
        : [];
      const focusable = [...panelFocusable, ...externalFocusable]
        .filter((control, index, controls) => controls.indexOf(control) === index);
      if (focusable.length === 0) {
        keyboardEvent.preventDefault();
        panel.focus();
        return;
      }
      const activeIndex = focusable.indexOf(browserPlatform.activeElement() as HTMLElement);
      const direction = keyboardEvent.shiftKey ? -1 : 1;
      const nextIndex = activeIndex < 0
        ? 0
        : (activeIndex + direction + focusable.length) % focusable.length;
      keyboardEvent.preventDefault();
      focusable[nextIndex]!.focus({ preventScroll: true });
    };

    const removeKeyDown = browserPlatform.listenDocument('keydown', handleKeyDown, true);
    return () => {
      browserPlatform.cancelFrame(frame);
      removeKeyDown();
      browserPlatform.defer(() => {
        const successor = browserPlatform.documentTarget()
          ?.querySelector('[role="dialog"][aria-modal="true"]');
        if (successor) return;
        browserPlatform.deferFocus(previouslyFocused);
      });
    };
  }, [externalFocusSelector, onCancel, onConfirm, open]);

  if (!open) return null;

  return (
    <div
      className={`sheet-backdrop sheet-backdrop--${placement}`}
      data-testid="action-sheet-backdrop"
      data-sheet-placement={placement}
      onClick={(event) => {
        if (dismissOnBackdropClick && event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section
        ref={panelRef}
        className={`action-sheet action-sheet--${tone} action-sheet--placement-${placement}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal={externalFocusSelector ? undefined : 'true'}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onFocusCapture={(event) => {
          syncSelectedAction(event.target);
          syncArrowSelection(event.target);
        }}
      >
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descriptionId}>{description}</p>}
        <div className="action-sheet__actions">{children}</div>
      </section>
    </div>
  );
}
