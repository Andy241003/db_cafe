// src/hooks/useModal.ts

import { useState } from 'react';

interface UseModalReturn<T = any> {
  isOpen: boolean;
  modalData: T | null;
  openModal: (data?: T) => void;
  closeModal: () => void;
}

export const useModal = <T = any>(): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<T | null>(null);

  const openModal = (data?: T): void => {
    setModalData(data || null);
    setIsOpen(true);
  };

  const closeModal = (): void => {
    setIsOpen(false);
    setModalData(null);
  };

  return {
    isOpen,
    modalData,
    openModal,
    closeModal
  };
};