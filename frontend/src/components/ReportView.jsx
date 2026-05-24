import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Thermometer,
  BatteryCharging,
  Zap,
  BarChart3,
  Cpu,
  FileSearch,
  Flame,
  Wrench,
  ArrowUp,
  Send,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Label,
} from "recharts";
import { backendUrl, createMaintenanceRequest } from "../services/api";

function getImageUrl(path) {
  if (!path) return null;
  return `${backendUrl}/${path.replace(/\\/g, "/")}`;
}

function getPointTypeText(classification) {
  return classification === "hotpoint"
    ? "Hotpoint detectado"
    : "Posible hotpoint";
}

function getRiskStyle(nivel) {
  const n = (nivel || "").toLowerCase();

  if (n.includes("crít") || n.includes("alto")) {
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      label: "text-red-600",
    };
  }

  if (n.includes("medio") || n.includes("moder")) {
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      label: "text-amber-600",
    };
  }

  return {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    label: "text-emerald-600",
  };
}

const cardHover =
  "transition-all duration-200 hover:scale-105 hover:shadow-lg hover:-translate-y-0.5 cursor-default";

function ReportView({ report }) {
  const [selectedPanelIndex, setSelectedPanelIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("analisis");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [maintenanceRequestId, setMaintenanceRequestId] = useState(null);
  const [creatingRequest, setCreatingRequest] = useState(false);

  const selectedPanelRef = useRef(null);

  useEffect(() => {
    if (report) {
      setActiveTab("analisis");
      setSelectedPanelIndex(0);

      const data = report.data ? report.data : report;
      setMaintenanceStatus(data.maintenance_status || null);
      setMaintenanceRequestId(data.maintenance_request_id || null);
    }
  }, [report]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectPanel = (index) => {
    setSelectedPanelIndex(index);

    setTimeout(() => {
      selectedPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const analysisId =
    report.analysis_id ||
    data.analysis_id ||
    data.id ||
    data.document_id ||
    null;

  const processedImage = getImageUrl(data.processed_image_path);
  const affectedPanels = data.affected_panels || [];
  const selectedAffectedPanel = affectedPanels[selectedPanelIndex];
  const selectedImage = getImageUrl(selectedAffectedPanel?.image_path);
  const network = data.network_report;

  const allPoints = data.all_points || [
    ...(data.hotpoints || []),
    ...(data.possible_hotpoints || []),
  ];

  const hotpointsCount =
    data.hotpoints_count ??
    allPoints.filter((p) => p.classification === "hotpoint").length;

  const possibleHotpointsCount =
    data.possible_hotpoints_count ??
    allPoints.filter((p) => p.classification === "possible_hotpoint").length;

  const risk = getRiskStyle(
    selectedAffectedPanel?.estimated_life?.nivel_riesgo ||
      data.estimated_life?.nivel_riesgo
  );

  const recommendations =
    selectedAffectedPanel?.recommendations?.recomendaciones ||
    data.recommendations?.recomendaciones ||
    [];

  const buildMaintenanceTasks = () => {
    return recommendations.map((item, index) => ({
      id: index + 1,
      title: item.componente || `Tarea ${index + 1}`,
      description: item.decision || "Revisar componente afectado.",
      se_repara: item.se_repara || "",
      completed: false,
      feedback: "",
    }));
  };

  const handleCreateMaintenanceRequest = async () => {
    if (!analysisId) {
      alert(
        "No se encontró el ID del análisis. Abre este reporte desde el historial o genera nuevamente el análisis."
      );
      return;
    }

    if (recommendations.length === 0) {
      alert("No hay recomendaciones disponibles para generar la solicitud.");
      return;
    }

    try {
      setCreatingRequest(true);

      const payload = {
        analysis_id: analysisId,
        analysis_data: {
          ...data,
          id: analysisId,
        },
        tasks: buildMaintenanceTasks(),
      };

      const response = await createMaintenanceRequest(payload);

      if (!response.success) {
        alert(response.message || "No se pudo generar la solicitud.");
        return;
      }

      setMaintenanceStatus("pending");
      setMaintenanceRequestId(response.request_id);

      alert("Solicitud enviada correctamente al área de mantenimiento.");
    } catch (error) {
      console.error(error);
      alert("Error generando la solicitud de mantenimiento.");
    } finally {
      setCreatingRequest(false);
    }
  };

  const renderMaintenanceButton = () => {
    if (maintenanceStatus === "reviewed") {
      return (
        <div className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2">
          <ClipboardCheck size={20} />
          Mantenimiento realizado
        </div>
      );
    }

    if (maintenanceStatus === "pending") {
      return (
        <div className="bg-amber-100 text-amber-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2">
          <Clock size={20} />
          Solicitud enviada a mantenimiento
        </div>
      );
    }

    return (
      <button
        onClick={handleCreateMaintenanceRequest}
        disabled={creatingRequest}
        className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 disabled:bg-gray-400"
      >
        <Send size={20} />
        {creatingRequest ? "Generando solicitud..." : "Generar solicitud"}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-2xl shadow-emerald-300 hover:scale-110 transition-all duration-200 animate-fade-in"
          title="Volver arriba"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>

      <div className="bg-slate-50 border-b border-slate-200 px-6 pt-5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
              <FileSearch className="w-5 h-5 text-white" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">
                Reporte de detección
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Resultados del análisis termográfico
              </p>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "analisis", label: "Análisis Visual", icon: Cpu },
              {
                id: "hotpoints",
                label: `Hotpoints (${allPoints.length})`,
                icon: Flame,
              },
              { id: "red", label: "Reporte de red", icon: BarChart3 },
              { id: "recom", label: "Recomendaciones", icon: Wrench },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "analisis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div
                className={`bg-slate-50 border border-slate-100 rounded-xl p-4 ${cardHover}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                  Panel
                </p>
                <p className="font-bold text-slate-800 text-sm leading-tight">
                  {data.panel?.marca || "Genérico"}
                </p>
                <p className="text-xs text-slate-400">{data.panel?.modelo}</p>
              </div>

              <div
                className={`bg-orange-50 border border-orange-100 rounded-xl p-4 ${cardHover}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-orange-600 font-bold mb-1">
                  Temp. Máxima
                </p>
                <p className="font-bold text-orange-700 text-lg leading-none">
                  {data.hotpoint_temperature} °C
                </p>
              </div>

              <div
                className={`bg-blue-50 border border-blue-100 rounded-xl p-4 ${cardHover}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-1">
                  Hotpoints
                </p>
                <p className="font-bold text-blue-700 text-lg leading-none">
                  {hotpointsCount}
                </p>
              </div>

              <div
                className={`bg-yellow-50 border border-yellow-100 rounded-xl p-4 ${cardHover}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-yellow-600 font-bold mb-1">
                  Posibles
                </p>
                <p className="font-bold text-yellow-700 text-lg leading-none">
                  {possibleHotpointsCount}
                </p>
              </div>

              <div
                className={`${risk.bg} border ${risk.border} rounded-xl p-4 ${cardHover}`}
              >
                <p
                  className={`text-[10px] uppercase tracking-wider ${risk.label} font-bold mb-1`}
                >
                  Riesgo
                </p>
                <p className={`font-bold text-lg leading-none ${risk.text}`}>
                  {selectedAffectedPanel?.estimated_life?.nivel_riesgo ||
                    data.estimated_life?.nivel_riesgo ||
                    "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase">
                  Imagen procesada con paneles afectados
                </h3>

                <div className="bg-slate-900 rounded-xl p-2 border border-slate-200 min-h-[300px] flex items-center justify-center">
                  {processedImage && (
                    <img
                      src={processedImage}
                      alt="Imagen procesada"
                      className="w-full max-h-[560px] object-contain rounded-lg shadow-2xl"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">
                  Paneles afectados detectados
                </h3>

                {affectedPanels.length > 0 ? (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {affectedPanels.map((panel, index) => (
                      <button
                        key={panel.id || index}
                        onClick={() => handleSelectPanel(index)}
                        className={`w-full border rounded-xl p-2 text-left transition hover:shadow-md ${
                          selectedPanelIndex === index
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <img
                          src={getImageUrl(panel.image_path)}
                          alt={`Panel afectado ${index + 1}`}
                          className="w-full rounded-lg object-contain bg-black max-h-44"
                        />

                        <p className="font-bold text-sm mt-2">
                          Panel afectado #{index + 1}
                        </p>

                        <p className="text-sm text-slate-600">
                          Temperatura: {panel.hotpoint_temperature} °C
                        </p>

                        <p className="text-sm text-slate-600">
                          Tipo: {getPointTypeText(panel.classification)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-xl p-6 text-center text-slate-500">
                    No se detectaron paneles afectados.
                  </div>
                )}

                {allPoints.length > 0 ? (
                  <div className="bg-red-100 text-red-700 rounded-xl p-4 flex gap-2">
                    <AlertTriangle />
                    <div>
                      <p>Se detectaron {hotpointsCount} hotpoints.</p>
                      <p>
                        Se detectaron {possibleHotpointsCount} posibles
                        hotpoints.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-100 text-green-700 rounded-xl p-4 flex gap-2">
                    <CheckCircle />
                    <span>No se detectaron hotpoints.</span>
                  </div>
                )}
              </div>
            </div>

            {selectedAffectedPanel && (
              <div
                ref={selectedPanelRef}
                className="border rounded-2xl p-5 bg-gray-50 scroll-mt-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Reporte del panel seleccionado
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {selectedImage && (
                      <img
                        src={selectedImage}
                        alt="Panel seleccionado"
                        className="w-full rounded-xl border object-contain bg-black"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Tipo de Panel</p>
                      <p className="font-bold text-gray-800">
                        {data.panel?.marca} - {data.panel?.modelo}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Tipo de detección
                      </p>
                      <p className="font-bold text-gray-800">
                        {getPointTypeText(selectedAffectedPanel.classification)}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Temperatura del Hotpoint
                      </p>
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <Thermometer size={18} />
                        {selectedAffectedPanel.hotpoint_temperature} °C
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">
                        Vida útil estimada
                      </p>
                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <BatteryCharging size={18} />
                        {selectedAffectedPanel.estimated_life
                          ?.vida_util_estimada_anios || "N/A"}{" "}
                        años
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4">
                      <p className="text-sm text-gray-500">Nivel de riesgo</p>
                      <p className="font-bold text-gray-800">
                        {selectedAffectedPanel.estimated_life?.nivel_riesgo ||
                          "N/A"}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 md:col-span-2">
                      <p className="text-sm text-gray-500">
                        Pérdida de energía
                      </p>

                      <p className="font-bold text-gray-800 flex items-center gap-1">
                        <Zap size={18} />
                        {selectedAffectedPanel.energy_loss
                          ?.perdida_potencia_w || "N/A"}{" "}
                        W perdidos
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        Pérdida:{" "}
                        {selectedAffectedPanel.energy_loss
                          ?.porcentaje_perdida || "N/A"}
                        % | Potencia efectiva:{" "}
                        {selectedAffectedPanel.energy_loss
                          ?.potencia_efectiva_w || "N/A"}{" "}
                        W
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "hotpoints" && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">Temperatura</th>
                  <th className="p-4 font-bold">Área</th>
                  <th className="p-4 font-bold">Tipo</th>
                  <th className="p-4 font-bold">Coordenadas</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {allPoints.length > 0 ? (
                  allPoints.map((hotpoint, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-400">
                        #{(index + 1).toString().padStart(2, "0")}
                      </td>

                      <td className="p-4 font-bold text-orange-600">
                        {hotpoint.temperature} °C
                      </td>

                      <td className="p-4 text-slate-600">
                        {Math.round(hotpoint.area || 0)}
                      </td>

                      <td className="p-4">
                        {hotpoint.classification === "hotpoint" ? (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                            Hotpoint detectado
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                            Posible hotpoint
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-500 italic">
                        X:{hotpoint.center_x} Y:{hotpoint.center_y}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan="5">
                      No hay hotpoints registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "red" && network && (
          <div className="border rounded-2xl p-5 bg-blue-50">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reporte general de red
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Estado del inversor</p>
                <p className="font-bold text-gray-800">
                  {network.estado_inversor}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Hotpoints totales</p>
                <p className="font-bold text-gray-800">
                  {network.total_hotpoints}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">kW perdidos</p>
                <p className="font-bold text-gray-800">
                  {network.perdida_total_kw} kW
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-500">Precio kWh simulado</p>
                <p className="font-bold text-gray-800">
                  ${network.precio_kwh_cop} COP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-1">
                  Gráfica de eficacia de la red
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Muestra cómo disminuye el rendimiento durante los meses.
                </p>

                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={network.grafica_eficacia_red}
                    margin={{ top: 20, right: 20, left: 10, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time">
                      <Label
                        value="Tiempo de operación"
                        offset={-20}
                        position="insideBottom"
                      />
                    </XAxis>
                    <YAxis domain={[0, 100]}>
                      <Label
                        value="Eficacia de la red (%)"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Eficacia"]}
                      labelFormatter={(label) => `Periodo: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-1">
                  Gráfica de pérdida económica
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Calcula el dinero perdido según los kWh no producidos.
                </p>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={network.grafica_perdida_economica}
                    margin={{ top: 20, right: 20, left: 20, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time">
                      <Label
                        value="Tiempo de operación"
                        offset={-20}
                        position="insideBottom"
                      />
                    </XAxis>
                    <YAxis>
                      <Label
                        value="Pérdida económica (COP)"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "loss_cop") {
                          return [`$${value} COP`, "Pérdida económica"];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Periodo: ${label}`}
                    />
                    <Bar dataKey="loss_cop" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-4">
                <h4 className="font-bold mb-1">
                  Gráfica de aumento de potencia
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Simula el estrés eléctrico por aumento de temperatura.
                </p>

                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={network.grafica_aumento_potencia}
                    margin={{ top: 20, right: 20, left: 10, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time">
                      <Label
                        value="Tiempo de operación"
                        offset={-20}
                        position="insideBottom"
                      />
                    </XAxis>
                    <YAxis>
                      <Label
                        value="Potencia estimada (W)"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip
                      formatter={(value) => [
                        `${value} W`,
                        "Potencia estimada",
                      ]}
                      labelFormatter={(label) => `Periodo: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="power_stress_w"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "recom" && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">
                  Recomendaciones de mantenimiento
                </h3>
                <p className="text-sm text-slate-500">
                  Estas recomendaciones se convertirán en tareas para el área de
                  mantenimiento.
                </p>
                {maintenanceRequestId && (
                  <p className="text-xs text-slate-400 mt-1">
                    Solicitud: {maintenanceRequestId}
                  </p>
                )}
              </div>

              {renderMaintenanceButton()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.length > 0 ? (
                recommendations.map((item, index) => {
                  const seRepara = item.se_repara
                    ?.toString()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

                  const esReparable = seRepara === "si" || seRepara === "sí";

                  return (
                    <div
                      key={index}
                      className={`border rounded-2xl p-5 transition-all ${
                        esReparable
                          ? "border-slate-200 bg-white"
                          : "border-red-200 bg-red-50/20"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-extrabold text-slate-800">
                          {item.componente}
                        </h4>

                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            esReparable
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {esReparable ? "Reparar" : "Reemplazo"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {item.decision}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="md:col-span-2 border rounded-2xl p-6 text-center text-slate-500">
                  No hay recomendaciones disponibles para este análisis.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportView;