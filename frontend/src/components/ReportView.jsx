import { AlertTriangle, CheckCircle, Thermometer, BatteryCharging } from "lucide-react";
import { backendUrl } from "../services/api";

function getImageUrl(path) {
  if (!path) return null;
  return `${backendUrl}/${path.replace(/\\/g, "/")}`;
}

function ReportView({ report }) {
  if (!report) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Aquí aparecerá el reporte cuando generes un análisis.
        </p>
      </div>
    );
  }

  const data = report.data ? report.data : report;

  const originalImage = getImageUrl(data.original_image_path);
  const processedImage = getImageUrl(data.processed_image_path);
  const affectedImage = getImageUrl(data.affected_panel_path);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Reporte de detección
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Panel</p>
          <p className="font-bold text-gray-800">
            {data.panel?.marca} - {data.panel?.modelo}
          </p>
        </div>

        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Temperatura Hot Point</p>
          <p className="font-bold text-gray-800 flex items-center gap-1">
            <Thermometer size={18} />
            {data.hotpoint_temperature} °C
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Vida útil estimada</p>
          <p className="font-bold text-gray-800 flex items-center gap-1">
            <BatteryCharging size={18} />
            {data.estimated_life?.vida_util_estimada_anios} años
          </p>
        </div>

        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Nivel de riesgo</p>
          <p className="font-bold text-gray-800">
            {data.estimated_life?.nivel_riesgo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="font-bold text-gray-700 mb-2">
            Imagen procesada con zonas detectadas
          </h3>

          {processedImage && (
            <img
              src={processedImage}
              alt="Imagen procesada"
              className="w-full rounded-xl border object-contain max-h-[520px] bg-black"
            />
          )}
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-2">
            Panel afectado detectado
          </h3>

          {affectedImage ? (
            <img
              src={affectedImage}
              alt="Panel afectado"
              className="w-full rounded-xl border object-contain bg-black"
            />
          ) : (
            <div className="border rounded-xl p-6 text-center text-gray-500">
              No se detectó panel afectado.
            </div>
          )}

          <div className="mt-4">
            {data.hotpoint_detected ? (
              <div className="bg-red-100 text-red-700 rounded-xl p-4 flex gap-2">
                <AlertTriangle />
                <span>
                  Se detectaron {data.possible_hotpoints?.length || 0} posibles hot points.
                </span>
              </div>
            ) : (
              <div className="bg-green-100 text-green-700 rounded-xl p-4 flex gap-2">
                <CheckCircle />
                <span>No se detectaron hot points críticos.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Posibles hot points detectados
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Temperatura</th>
                <th className="p-3 text-left">Área</th>
                <th className="p-3 text-left">Coordenadas</th>
              </tr>
            </thead>

            <tbody>
              {data.possible_hotpoints?.length > 0 ? (
                data.possible_hotpoints.map((hotpoint, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-bold">{hotpoint.temperature} °C</td>
                    <td className="p-3">{hotpoint.area}</td>
                    <td className="p-3">
                      X: {hotpoint.x}, Y: {hotpoint.y}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-gray-500" colSpan="4">
                    No hay posibles hot points registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Recomendaciones por componente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations?.recomendaciones?.map((item, index) => (
            <div key={index} className="border rounded-xl p-4">
              <p className="font-bold text-gray-800">{item.componente}</p>
              <p className="text-sm text-gray-600">
                ¿Se repara?: {item.se_repara}
              </p>
              <p className="text-sm text-gray-700 mt-2">{item.decision}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportView;