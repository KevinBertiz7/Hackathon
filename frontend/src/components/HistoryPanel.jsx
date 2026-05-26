import { Clock, AlertTriangle } from "lucide-react";

function handleMouseGlow(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();

  card.style.setProperty("--x", `${e.clientX - rect.left}px`);
  card.style.setProperty("--y", `${e.clientY - rect.top}px`);
}

function HistoryPanel({ history, onSelectHistory }) {
  return (
    <div
      onMouseMove={handleMouseGlow}
      className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Historial de análisis
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500">Todavía no hay análisis guardados.</p>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectHistory(item.id)}
              onMouseMove={handleMouseGlow}
              className="w-full text-left border rounded-xl p-4 interactive-card hover:bg-green-50 transition"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800">
                  {item.panel?.marca} - {item.panel?.modelo}
                </p>

                {item.hotpoint_detected && (
                  <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                )}
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Paneles afectados: {item.affected_panels?.length || 0}
              </p>

              <p className="text-sm text-gray-600">
                Hotpoints:{" "}
                {item.hotpoints_count ??
                  item.hotpoints?.length ??
                  item.possible_hotpoints?.length ??
                  0}
              </p>

              <p className="text-sm text-gray-600">
                Temperatura máxima: {item.hotpoint_temperature} °C
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