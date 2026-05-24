import { useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  Cpu,
  Flame,
  Sparkles,
} from "lucide-react";

function ConfigPanel({
  panels,
  selectedPanel,
  setSelectedPanel,
  selectedImage,
  setSelectedImage,
  onAnalyze,
  loading,
}) {
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreview(null);
  };

  const panelInfo = panels.find((p) => p.id === selectedPanel);
  const step1Done = !!selectedPanel;
  const step2Done = !!selectedImage;
  const ready = step1Done && step2Done;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header con gradiente sutil */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-md shadow-emerald-200">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">
                Configuración
              </h2>
              <p className="text-xs text-slate-500">
                Setup del análisis térmico
              </p>
            </div>
          </div>

          {ready && (
            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              Listo
            </div>
          )}
        </div>

        {/* Stepper horizontal */}
        <div className="flex items-center gap-2 mt-5">
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
                step1Done
                  ? "bg-emerald-600 text-white"
                  : "bg-white border-2 border-slate-300 text-slate-500"
              }`}
            >
              {step1Done ? <CheckCircle2 className="w-4 h-4" /> : "1"}
            </div>
            <div
              className={`h-0.5 flex-1 rounded ${
                step1Done ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
                step2Done
                  ? "bg-emerald-600 text-white"
                  : "bg-white border-2 border-slate-300 text-slate-500"
              }`}
            >
              {step2Done ? <CheckCircle2 className="w-4 h-4" /> : "2"}
            </div>
            <div
              className={`h-0.5 flex-1 rounded ${
                step2Done ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
          </div>
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition ${
              ready
                ? "bg-emerald-600 text-white"
                : "bg-white border-2 border-slate-300 text-slate-500"
            }`}
          >
            3
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {/* Paso 1: Selector de panel */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span className="text-emerald-600">①</span>
            Datasheet del panel
          </label>

          <div className="relative">
            <select
              value={selectedPanel}
              onChange={(e) => setSelectedPanel(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-xl px-4 py-3 pr-10 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition cursor-pointer"
            >
              <option value="">— Seleccione un panel —</option>
              {panels.map((panel) => (
                <option key={panel.id} value={panel.id}>
                  {panel.marca} — {panel.modelo}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              ▾
            </div>
          </div>

          {panelInfo && (
            <div className="mt-2 bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-800 truncate">
                <span className="font-semibold">{panelInfo.marca}</span>{" "}
                <span className="text-emerald-600">{panelInfo.modelo}</span>
              </p>
            </div>
          )}
        </div>

        {/* Paso 2: Upload de imagen */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span className="text-emerald-600">②</span>
            Imagen termográfica
          </label>

          {!preview ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition overflow-hidden ${
                dragOver
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
              }`}
            >
              {/* Decoración de gradiente térmico */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-red-500 opacity-60" />

              <div className="bg-white p-3 rounded-full shadow-md mb-3">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-slate-700 font-semibold text-sm">
                Arrastra o haz clic
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPG · PNG · TIFF (formato térmico)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
              <img
                src={preview}
                alt="Preview térmica"
                className="w-full h-44 object-cover"
              />
              {/* Overlay inferior */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                <div className="flex items-center gap-2 text-white">
                  <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">
                    {selectedImage?.name}
                  </span>
                  <span className="text-xs text-slate-300">
                    {(selectedImage?.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              {/* Botón quitar */}
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/95 hover:bg-white text-red-600 rounded-full p-1.5 shadow-lg transition hover:scale-110"
                title="Quitar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Paso 3: Botón analizar */}
        <button
          onClick={onAnalyze}
          disabled={loading || !ready}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm ${
            loading || !ready
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200 hover:shadow-md"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando imagen...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generar reporte
            </>
          )}
        </button>

        {!ready && !loading && (
          <p className="text-xs text-slate-400 text-center -mt-2">
            Completa los pasos para habilitar el análisis
          </p>
        )}
      </div>
    </div>
  );
}

export default ConfigPanel;