'use client';

import { useEffect } from 'react';
import styles from './ConfirmationDialog.module.css';

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary' | 'success';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={() => !busy && onCancel()}>
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">!</div>
        <div>
          <h2 id="confirmation-title" className={styles.title}>{title}</h2>
          <p id="confirmation-description" className={styles.description}>{description}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`${styles.confirm} ${styles[tone]}`} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
