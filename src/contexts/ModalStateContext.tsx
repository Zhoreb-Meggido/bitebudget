/**
 * ModalStateContext - Track open modals to prevent data loss during auto-sync
 *
 * Problem: Auto-sync triggers data reload every 5 minutes, which causes modals
 * to lose unsaved changes. This context allows modals to "lock" auto-sync while
 * they have pending changes.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalStateContextType {
  // Register a modal as having unsaved changes
  registerDirtyModal: (modalId: string) => void;

  // Unregister a modal (when closed or saved)
  unregisterDirtyModal: (modalId: string) => void;

  // Check if any modals have unsaved changes
  hasUnsavedChanges: () => boolean;

  // Get list of dirty modals (for debugging)
  getDirtyModals: () => string[];
}

const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

export function ModalStateProvider({ children }: { children: React.ReactNode }) {
  const [dirtyModals, setDirtyModals] = useState<Set<string>>(new Set());

  const registerDirtyModal = useCallback((modalId: string) => {
    setDirtyModals(prev => new Set(prev).add(modalId));
    console.log(`🔒 Modal locked: ${modalId}`);
  }, []);

  const unregisterDirtyModal = useCallback((modalId: string) => {
    setDirtyModals(prev => {
      const next = new Set(prev);
      next.delete(modalId);
      return next;
    });
    console.log(`🔓 Modal unlocked: ${modalId}`);
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    return dirtyModals.size > 0;
  }, [dirtyModals]);

  const getDirtyModals = useCallback(() => {
    return Array.from(dirtyModals);
  }, [dirtyModals]);

  return (
    <ModalStateContext.Provider value={{
      registerDirtyModal,
      unregisterDirtyModal,
      hasUnsavedChanges,
      getDirtyModals
    }}>
      {children}
    </ModalStateContext.Provider>
  );
}

export function useModalState() {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalState must be used within ModalStateProvider');
  }
  return context;
}

/**
 * Hook to register a modal and track its dirty state
 *
 * Usage:
 * const { markDirty, markClean } = useModalLock('add-meal-modal');
 *
 * // When user makes changes:
 * onChange={() => { setValue(x); markDirty(); }}
 *
 * // When saved or closed:
 * onSave={() => { save(); markClean(); onClose(); }}
 * onClose={() => { markClean(); }}
 */
export function useModalLock(modalId: string) {
  const { registerDirtyModal, unregisterDirtyModal } = useModalState();
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => {
    if (!isDirty) {
      setIsDirty(true);
      registerDirtyModal(modalId);
    }
  }, [isDirty, modalId, registerDirtyModal]);

  const markClean = useCallback(() => {
    if (isDirty) {
      setIsDirty(false);
      unregisterDirtyModal(modalId);
    }
  }, [isDirty, modalId, unregisterDirtyModal]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (isDirty) {
        unregisterDirtyModal(modalId);
      }
    };
  }, [isDirty, modalId, unregisterDirtyModal]);

  return { isDirty, markDirty, markClean };
}
