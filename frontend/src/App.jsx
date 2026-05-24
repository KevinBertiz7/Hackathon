import { useEffect, useState } from "react";
import { Sun, Flame, CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import ConfigPanel from "./components/ConfigPanel";
import ReportView from "./components/ReportView";
import HistoryPanel from "./components/HistoryPanel";
import {
  getPanels,
  analyzeImage,
  getHistory,
  getAnalysisById,
} from "./services/api";

function Toast({ toast, onClose }) {
  const config = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-500",
      text: "text-emerald-800",
      iconColor: "text-emerald-600",
      Icon: CheckCircle2,
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      text: "text-red-800",
      iconColor: "text-red-600",
      Icon: AlertCircle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-500",
      text: "text-amber-800",
      iconColor: "text-amber-600",
      Icon: AlertCircle,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      text: "text-blue-800",
      iconColor: "text-blue-600",
      Icon: Info,
    },
  };

  const c = config[toast.type] || config.info;
  const Icon = c.Icon;

  return (
    <div
      className={`${c.bg} ${c.text} border-l-4 ${c.border} rounded-xl shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      <Icon className={`w-5 h-5 ${c.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        className={`${c.iconColor} hover:opacity-70 transition`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function App() {
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadPanels = async () => {
    try {
      const data = await getPanels();
      setPanels(data);
    } catch (error) {
      console.error(error);
      showToast("Error cargando paneles desde el backend.", "error");
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPanel) {
      showToast("Selecciona un tipo de panel.", "warning");
      return;
    }

    if (!selectedImage) {
      showToast("Carga una imagen termográfica.", "warning");
      return;
    }

    try {
      setLoading(true);

      const result = await analyzeImage(selectedPanel, selectedImage);

      if (!result.success) {
        showToast(result.message || "No se pudo analizar la imagen.", "error");
        return;
      }

      setReport(result);
      await loadHistory();

      showToast("Reporte generado correctamente.", "success");
    } catch (error) {
      console.error(error);
      showToast("Error conectando con el backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = async (id) => {
    try {
      const data = await getAnalysisById(id);
      setReport(data);
    } catch (error) {
      console.error(error);
      showToast("No se pudo cargar el análisis seleccionado.", "error");
    }
  };

  useEffect(() => {
    loadPanels();
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <header className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white py-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-300/20 rounded-full blur-3xl pointer-events-none"></div>

        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-yellow-300 blur-2xl opacity-60 rounded-full"></div>
            <Sun
              className="w-16 h-16 text-yellow-300 relative animate-spin"
              strokeWidth={2.5}
              style={{ animationDuration: "12s" }}
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Solar
            <span className="text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.6)]">
              Hot
            </span>
            <span className="text-emerald-100">IA</span>
          </h1>

          <p className="text-emerald-100 mt-2 text-sm md:text-base max-w-md">
            Detector inteligente de hot points en sistemas fotovoltaicos
          </p>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-px w-12 bg-yellow-300/50"></div>
            <Flame className="w-4 h-4 text-yellow-300" />
            <div className="h-px w-12 bg-yellow-300/50"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ConfigPanel
            panels={panels}
            selectedPanel={selectedPanel}
            setSelectedPanel={setSelectedPanel}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            onAnalyze={handleAnalyze}
            loading={loading}
          />

          <HistoryPanel
            history={history}
            onSelectHistory={handleSelectHistory}
          />

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Semáforo</h2>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full"></div>
                  <div className="w-4 h-4 rounded-full bg-red-500 relative animate-pulse"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-700">Crítico — Reemplazo</p>
                  <p className="text-xs text-gray-600">
                    Daño irreversible, requiere cambio
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 blur-md opacity-50 rounded-full"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-400 relative"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-yellow-700">
                    Atención — Reparar
                  </p>
                  <p className="text-xs text-gray-600">
                    Falla recuperable con intervención
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 blur-md opacity-50 rounded-full"></div>
                  <div className="w-4 h-4 rounded-full bg-green-500 relative"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-700">
                    Óptimo — Mantenimiento
                  </p>
                  <p className="text-xs text-gray-600">
                    Sin acción urgente requerida
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ReportView report={report} />
      </main>
    </div>
  );
}

export default App;