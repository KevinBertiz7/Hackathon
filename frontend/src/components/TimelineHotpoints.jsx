import { TrendingUp, CalendarDays, Flame, AlertCircle } from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";

  const date = new Date(dateString);

  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHotpointsCount(item) {
  return (
    item.hotpoints_count ??
    item.hotpoints?.length ??
    0
  );
}

function getPossibleHotpointsCount(item) {
  return (
    item.possible_hotpoints_count ??
    item.possible_hotpoints?.length ??
    0
  );
}

function TimelineHotpoints({ history = [] }) {
  const timeline = [...history]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-12);

  const latest = timeline[timeline.length - 1];

  if (timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Evolución de hotpoints en el tiempo
            </h2>
            <p className="text-sm text-slate-500">
              Comportamiento de hotpoints detectados y posibles hotpoints a lo largo de los análisis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Hotpoints detectados
          </div>

          <div className="flex items-center gap-2 text-amber-600">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            Posibles hotpoints
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[1000px] px-4">
          <div className="relative flex items-end justify-between pt-4 pb-10">
            <div className="absolute left-0 right-0 bottom-5 h-[3px] bg-emerald-600 rounded-full" />

            {timeline.map((item, index) => {
              const hotpoints = getHotpointsCount(item);
              const possible = getPossibleHotpointsCount(item);
              const isLast = index === timeline.length - 1;

              return (
                <div
                  key={item.id || index}
                  className="relative flex flex-col items-center min-w-[130px]"
                >
                  <p className="text-xs font-bold text-slate-800 text-center mb-1">
                    {formatDate(item.created_at).split(",")[0]}
                  </p>

                  <p className="text-xs text-slate-500 text-center mb-4">
                    {formatDate(item.created_at).split(",")[1] || ""}
                  </p>

                  <div className="bg-red-500 text-white text-sm font-bold rounded-lg px-3 py-1 shadow-sm mb-2 min-w-[36px] text-center">
                    {hotpoints}
                  </div>

                  <div className="bg-amber-500 text-white text-sm font-bold rounded-lg px-3 py-1 shadow-sm mb-8 min-w-[36px] text-center">
                    {possible}
                  </div>

                  <div className="absolute bottom-3 w-[2px] h-8 bg-emerald-200" />

                  <div
                    className={`absolute bottom-0 w-5 h-5 rounded-full border-4 ${
                      isLast
                        ? "bg-emerald-600 border-emerald-200 ring-4 ring-emerald-100"
                        : "bg-emerald-600 border-white"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {latest && (
        <div className="bg-emerald-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold">
            <CalendarDays size={18} />
            Análisis más reciente:
          </div>

          <span className="text-slate-600">
            {formatDate(latest.created_at)}
          </span>

          <span className="hidden md:block text-slate-400">|</span>

          <div className="flex items-center gap-2 text-red-600 font-bold">
            <Flame size={18} />
            Hotpoints detectados: {getHotpointsCount(latest)}
          </div>

          <span className="hidden md:block text-slate-400">|</span>

          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <AlertCircle size={18} />
            Posibles hotpoints: {getPossibleHotpointsCount(latest)}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineHotpoints;