'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

type AlertVariant = 'danger' | 'warning' | 'info' | 'success';

interface AlertOptions {
  title: string;
  description?: string;
  okLabel?: string;
  variant?: AlertVariant;
}

interface AlertState extends AlertOptions {
  resolve: () => void;
}

interface AlertContextType {
  alert: (options: AlertOptions | string) => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const VARIANT_STYLES: Record<AlertVariant, { icon: React.ReactNode; iconWrap: string; okBtn: string }> = {
  danger: {
    icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
    iconWrap: 'bg-rose-50',
    okBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    iconWrap: 'bg-amber-50',
    okBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    iconWrap: 'bg-blue-50',
    okBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    iconWrap: 'bg-emerald-50',
    okBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

export const AlertDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AlertState | null>(null);

  const alert = useCallback((options: AlertOptions | string) => {
    return new Promise<void>((resolve) => {
      const normalized: AlertOptions = typeof options === 'string' ? { title: options } : options;
      setState({ variant: 'info', okLabel: 'OK', ...normalized, resolve });
    });
  }, []);

  const dismiss = useCallback(() => {
    if (!state) return;
    state.resolve();
    setState(null);
  }, [state]);

  const value = useMemo(() => ({ alert }), [alert]);

  const styles = state ? VARIANT_STYLES[state.variant || 'info'] : VARIANT_STYLES.info;

  return (
    <AlertContext.Provider value={value}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="alert-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') dismiss();
          }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 fade-in">
            <div className="flex items-start gap-3 p-5">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconWrap}`}>
                {styles.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 id="alert-dialog-title" className="text-sm font-bold text-slate-900">
                  {state.title}
                </h2>
                {state.description && (
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{state.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end px-5 pb-5">
              <button
                type="button"
                autoFocus
                onClick={dismiss}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${styles.okBtn}`}
              >
                {state.okLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlertDialog = (): ((options: AlertOptions | string) => Promise<void>) => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within an AlertDialogProvider');
  }
  return context.alert;
};
