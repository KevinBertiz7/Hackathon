import { Upload, FileText, Loader2 } from "lucide-react";

function ConfigPanel({
  panels,
  selectedPanel,
  setSelectedPanel,
  selectedImage,
  setSelectedImage,
  onAnalyze,
  loading,
}) {
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedImage(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Configuración del análisis
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Selecciona el datasheet del panel
        </label>

        <select
          value={selectedPanel}
          onChange={(e) => setSelectedPanel(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Seleccione un panel</option>

          {panels.map((panel) => (
            <option key={panel.id} value={panel.id}>
              {panel.marca} - {panel.modelo}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cargar imagen termográfica
        </label>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-green-400 rounded-xl p-6 cursor-pointer hover:bg-green-50">
          <Upload className="w-10 h-10 text-green-600 mb-2" />

          <span className="text-gray-700 font-medium">
            Presiona para elegir una imagen
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        {selectedImage && (
          <p className="mt-3 text-sm text-green-600 font-semibold">
            Imagen cargada correctamente: {selectedImage.name}
          </p>
        )}
      </div>

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            Analizando imagen...
          </>
        ) : (
          <>
            <FileText />
            Generar reporte
          </>
        )}
      </button>
    </div>
  );
}

export default ConfigPanel;