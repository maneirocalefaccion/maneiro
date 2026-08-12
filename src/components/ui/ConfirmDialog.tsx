'use client';

import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  dangerMode?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  dangerMode = false,
}) => {
  const footer = (
    <>
      <button className="btn btn-outline" onClick={onCancel}>
        Cancelar
      </button>
      <button
        className={`btn ${dangerMode ? 'btn-danger' : 'btn-primary'}`}
        onClick={onConfirm}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={footer}
    >
      <p>{message}</p>
    </Modal>
  );
};
