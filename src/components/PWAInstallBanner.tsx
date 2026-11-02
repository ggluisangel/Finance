import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* Top Banner or Quick Trigger Button */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-slate-200 backdrop-blur-md">
        <div className="flex items-center gap-2 font-medium">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <span>Instala <strong>FinanAI</strong> en tu iPhone para acceso rápido y sin conexión.</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Share className="w-3.5 h-3.5" />
              Ver en iPhone
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            aria-label="Cerrar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal Installation Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src="/icon.svg" alt="FinanAI Logo" className="w-12 h-12 rounded-2xl shadow-lg border border-emerald-500/30" />
                <div>
                  <h3 className="font-bold text-lg leading-tight">Instalar en iPhone / iPad</h3>
                  <p className="text-xs text-slate-400">PWA Local Mode</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-200 flex items-center gap-1.5">
                    Toca el botón <Share className="w-4 h-4 text-indigo-400 inline" /> <strong>Compartir</strong>
                  </p>
                  <p className="text-xs text-slate-400">En la barra inferior de Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-200 flex items-center gap-1.5">
                    Selecciona <PlusSquare className="w-4 h-4 text-emerald-400 inline" /> <strong>Agregar a inicio</strong>
                  </p>
                  <p className="text-xs text-slate-400">Desplázate hacia abajo en el menú de opciones.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-slate-200 flex items-center gap-1.5">
                    Confirma dando clic en <strong>Agregar</strong>
                  </p>
                  <p className="text-xs text-slate-400">¡Listo! La app se abrirá en pantalla completa como una app nativa.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
