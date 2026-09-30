'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

const VARIANT_STYLES: Record<ConfirmVariant, { icon: React.ReactNode; iconWrap: string; confirmBtn: string }> = {
  danger: {
    icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
    iconWrap: 'bg-rose-50',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    iconWrap: 'bg-amber-50',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    iconWrap: 'bg-blue-50',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const closingRef = useRef(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ variant: 'danger', confirmLabel: 'Confirm', cancelLabel: 'Cancel', ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      if (closingRef.current || !state) return;
      closingRef.current = true;
      state.resolve(value);
      setState(null);
      setBusy(false);
      closingRef.current = false;
    },
    [state]
  );

  const handleConfirm = useCallback(() => {
    setBusy(true);
    settle(true);
  }, [settle]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  const styles = state ? VARIANT_STYLES[state.variant || 'danger'] : VARIANT_STYLES.danger;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') settle(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 fade-in">
            <div className="flex items-start gap-3 p-5">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconWrap}`}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 id="confirm-dialog-title" className="text-sm font-bold text-slate-900">
                  {state.title}
                </h2>
                {state.description && (
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{state.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => settle(false)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => settle(false)}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={handleConfirm}
                disabled={busy}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${styles.confirmBtn}`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ((options: ConfirmOptions) => Promise<boolean>) => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context.confirm;
};
