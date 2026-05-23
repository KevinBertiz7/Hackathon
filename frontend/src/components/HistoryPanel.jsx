import { Clock, AlertTriangle } from "lucide-react";

function HistoryPanel({ history, onSelectHistory }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Historial de análisis
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500">
          Todavía no hay análisis guardados.
        </p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectHistory(item.id)}
              className="w-full text-left border rounded-xl p-4 hover:bg-green-50 transition"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800">
                  {item.panel?.marca} - {item.panel?.modelo}
                </p>

                {item.hotpoint_detected && (
                  <AlertTriangle className="text-red-500" size={20} />
                )}
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Temperatura: {item.hotpoint_temperature} °C
              </p>

              <p className="text-sm text-gray-600">
                Riesgo: {item.estimated_life?.nivel_riesgo}
              </p>

              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={14} />
                {item.created_at}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;