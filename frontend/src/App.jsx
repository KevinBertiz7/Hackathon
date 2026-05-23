import { useEffect, useState } from "react";
import ConfigPanel from "./components/ConfigPanel";
import ReportView from "./components/ReportView";
import HistoryPanel from "./components/HistoryPanel";
import {
  getPanels,
  analyzeImage,
  getHistory,
  getAnalysisById,
} from "./services/api";

function App() {
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPanels = async () => {
    try {
      const data = await getPanels();
      setPanels(data);
    } catch (error) {
      console.error(error);
      alert("Error cargando paneles desde el backend.");
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
      alert("Selecciona un tipo de panel.");
      return;
    }

    if (!selectedImage) {
      alert("Carga una imagen termográfica.");
      return;
    }

    try {
      setLoading(true);

      const result = await analyzeImage(selectedPanel, selectedImage);

      if (!result.success) {
        alert(result.message || "No se pudo analizar la imagen.");
        return;
      }

      setReport(result);
      await loadHistory();

      alert("Reporte generado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error conectando con el backend.");
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
      alert("No se pudo cargar el análisis seleccionado.");
    }
  };

  useEffect(() => {
    loadPanels();
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">
            SolarHotIA
          </h1>
          <p className="text-green-100 mt-1">
            Detector inteligente de hot points en sistemas fotovoltaicos
          </p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Estado del sistema
            </h2>

            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="font-bold text-green-700">
                  Backend FastAPI
                </p>
                <p className="text-sm text-gray-600">
                  Conectado a http://localhost:8000
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="font-bold text-blue-700">
                  Firebase
                </p>
                <p className="text-sm text-gray-600">
                  Historial y entrenamientos guardados en Firestore.
                </p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="font-bold text-yellow-700">
                  IA / Machine Learning
                </p>
                <p className="text-sm text-gray-600">
                  Procesamiento de imagen + detección térmica + Kohonen.
                </p>
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