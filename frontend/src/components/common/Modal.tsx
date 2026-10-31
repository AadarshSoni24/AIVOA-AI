import React, { useEffect, useRef, ReactNode } from 'react';
import { Icon, IconName } from '../Icon';

interface ModalProps {
  title: string;
  icon?: IconName;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  icon = 'info',
  children,
  onClose,
  footer
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const listener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const elements = closeRef.current
          ?.closest('[role="dialog"]')
          ?.querySelectorAll<HTMLElement>('button, input, textarea, [tabindex="0"]');
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <span className="modal-icon">
            <Icon name={icon} size={23} />
          </span>
          <button
            ref={closeRef}
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <h2 id="modal-title">{title}</h2>
        <div className="modal-content">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </section>
    </div>
  );
};

