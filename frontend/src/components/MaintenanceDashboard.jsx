import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Wrench,
  Save,
  ShieldCheck,
  FileText,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  getMaintenanceRequests,
  updateMaintenanceTasks,
  markMaintenanceAsReviewed,
  backendUrl,
} from "../services/api";

function getImageUrl(path) {
  if (!path) return null;
  return `${backendUrl}/${path.replace(/\\/g, "/")}`;
}

function formatDate(dateString) {
  if (!dateString) return "Sin fecha";

  return new Date(dateString).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleMouseGlow(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();

  card.style.setProperty("--x", `${e.clientX - rect.left}px`);
  card.style.setProperty("--y", `${e.clientY - rect.top}px`);
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const variants = {
    success: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      accent: "border-l-emerald-500",
      Icon: CheckCircle2,
    },
    error: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      accent: "border-l-red-500",
      Icon: AlertTriangle,
    },
    info: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      accent: "border-l-blue-500",
      Icon: Info,
    },
  };

  const v = variants[toast.type] || variants.info;
  const Icon = v.Icon;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-[slideIn_0.3s_ease-out]">
      <div
        className={`bg-white border border-slate-200 ${v.accent} border-l-4 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        <div
          className={`shrink-0 w-9 h-9 rounded-full ${v.iconBg} flex items-center justify-center`}
        >
          <Icon size={20} className={v.iconColor} strokeWidth={2.5} />
        </div>

        <p className="flex-1 font-semibold text-sm text-slate-700">
          {toast.message}
        </p>

        <button
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-1 transition"
        >
          <X size={16} />
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ConfirmModal({ open, title, message, onCancel, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[popIn_0.25s_ease-out] border border-slate-200">
        <div className="flex items-start gap-4 mb-2">
          <div className="shrink-0 w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center float-soft">
            <ShieldCheck
              size={22}
              className="text-emerald-600"
              strokeWidth={2.5}
            />
          </div>

          <div className="flex-1 pt-1">
            <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 hover:-translate-y-0.5"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            {loading ? "Procesando..." : "Sí, confirmar"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function MaintenanceDashboard({ onReviewed }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewedRequests, setReviewedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [tasks, setTasks] = useState([]);
  const [finalComment, setFinalComment] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  const loadRequests = async () => {
    try {
      const pending = await getMaintenanceRequests("pending");
      const reviewed = await getMaintenanceRequests("reviewed");

      setPendingRequests(Array.isArray(pending) ? pending : []);
      setReviewedRequests(Array.isArray(reviewed) ? reviewed : []);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      showToast("error", "No se pudieron cargar las solicitudes.");
    }
  };

  const selectRequest = (request) => {
    setSelectedRequest(request);
    setTasks(request.tasks || []);
    setFinalComment(request.final_comment || "");
  };

  const toggleTask = (index) => {
    const copy = [...tasks];
    copy[index].completed = !copy[index].completed;
    setTasks(copy);
  };

  const updateTaskFeedback = (index, value) => {
    const copy = [...tasks];
    copy[index].feedback = value;
    setTasks(copy);
  };

  const saveTasks = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);

      await updateMaintenanceTasks(selectedRequest.id, tasks);

      setSelectedRequest({
        ...selectedRequest,
        tasks,
      });

      await loadRequests();

      showToast("success", "Tareas guardadas correctamente.");
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudieron guardar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = () => {
    if (!selectedRequest) return;
    setConfirmOpen(true);
  };

  const reviewRequest = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);

      await updateMaintenanceTasks(selectedRequest.id, tasks);
      await markMaintenanceAsReviewed(selectedRequest.id, finalComment);

      setConfirmOpen(false);
      setSelectedRequest(null);
      setTasks([]);
      setFinalComment("");

      await loadRequests();

      if (onReviewed) {
        onReviewed();
      }

      showToast("success", "Solicitud marcada como revisada.");
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudo marcar como revisada.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const currentList =
    activeTab === "pending" ? pendingRequests : reviewedRequests;

  const analysis = selectedRequest?.analysis_data;
  const processedImage = getImageUrl(analysis?.processed_image_path);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmModal
        open={confirmOpen}
        loading={loading}
        title="Confirmar revisión"
        message="¿Seguro que deseas marcar esta solicitud como revisada? Esta acción no se puede deshacer."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={reviewRequest}
      />

      <style>{`
        @keyframes maintenance-title {
          0% {
            opacity: 0;
            transform: translateY(28px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes maintenance-icon {
          0% {
            opacity: 0;
            transform: scale(0.78) translateY(20px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes maintenance-content {
          0% {
            opacity: 0;
            transform: translateY(34px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes maintenance-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.34;
          }
        }

        .maintenance-title {
          opacity: 0;
          animation: maintenance-title 0.8s cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay: 0.1s;
        }

        .maintenance-icon {
          opacity: 0;
          animation: maintenance-icon 0.9s cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay: 0.65s;
        }

        .maintenance-content {
          opacity: 0;
          animation: maintenance-content 0.75s ease-out forwards;
          animation-delay: 1.1s;
        }

        .maintenance-content-delay {
          opacity: 0;
          animation: maintenance-content 0.75s ease-out forwards;
          animation-delay: 1.3s;
        }

        .maintenance-glow {
          animation: maintenance-glow 5s ease-in-out infinite;
        }
      `}</style>

      <header className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white py-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl -translate-x-20 -translate-y-24 maintenance-glow" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl translate-x-20 translate-y-20 maintenance-glow" />

        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="maintenance-icon bg-white/15 p-4 rounded-2xl mb-4 shadow-lg">
            <Wrench className="w-12 h-12 text-yellow-300" />
          </div>

          <h1 className="maintenance-title text-3xl md:text-4xl font-extrabold">
            Área de Mantenimiento
          </h1>

          <p className="maintenance-title text-emerald-100 mt-2 max-w-xl">
            Gestión de solicitudes generadas desde los análisis térmicos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="maintenance-content grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div
            onMouseMove={handleMouseGlow}
            className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
          >
            <p className="text-sm text-gray-500">Solicitudes pendientes</p>
            <p className="text-4xl font-extrabold text-amber-600">
              {pendingRequests.length}
            </p>
          </div>

          <div
            onMouseMove={handleMouseGlow}
            className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
          >
            <p className="text-sm text-gray-500">Solicitudes revisadas</p>
            <p className="text-4xl font-extrabold text-emerald-600">
              {reviewedRequests.length}
            </p>
          </div>

          <div
            onMouseMove={handleMouseGlow}
            className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
          >
            <p className="text-sm text-gray-500">Estado del módulo</p>
            <p className="text-xl font-extrabold text-gray-800">
              Mantenimiento activo
            </p>
          </div>
        </div>

        <div className="maintenance-content-delay grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section
            onMouseMove={handleMouseGlow}
            className="bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
          >
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setSelectedRequest(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition hover:-translate-y-0.5 hover:shadow-md ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white glow-active"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Clock size={18} />
                Pendientes
              </button>

              <button
                onClick={() => {
                  setActiveTab("reviewed");
                  setSelectedRequest(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition hover:-translate-y-0.5 hover:shadow-md ${
                  activeTab === "reviewed"
                    ? "bg-emerald-600 text-white glow-active"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <CheckCircle2 size={18} />
                Revisadas
              </button>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {currentList.length > 0 ? (
                currentList.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => selectRequest(request)}
                    onMouseMove={handleMouseGlow}
                    className={`w-full text-left border rounded-xl p-4 interactive-card ${
                      selectedRequest?.id === request.id
                        ? "border-emerald-600 bg-emerald-50 glow-active"
                        : "border-gray-200 bg-white hover:bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-gray-800">
                        {request.panel?.marca || "Panel"}{" "}
                        {request.panel?.modelo || ""}
                      </p>

                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${
                          request.status === "reviewed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {request.status === "reviewed"
                          ? "Revisada"
                          : "Pendiente"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      Creada: {formatDate(request.created_at)}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      Tareas: {request.tasks?.length || 0}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500 py-10">
                  No hay solicitudes en esta sección.
                </div>
              )}
            </div>
          </section>

          <section
            onMouseMove={handleMouseGlow}
            className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-slate-200 interactive-card"
          >
            {!selectedRequest ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-gray-500">
                <ClipboardList
                  size={60}
                  className="mb-3 text-gray-300 float-soft"
                />

                <p className="font-bold text-lg">
                  Selecciona una solicitud de mantenimiento
                </p>

                <p className="text-sm">
                  Aquí aparecerá el reporte del análisis y las tareas asociadas.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-800">
                      Solicitud de mantenimiento
                    </h2>

                    <p className="text-sm text-gray-500">
                      ID: {selectedRequest.id}
                    </p>

                    <p className="text-sm text-gray-500">
                      Fecha: {formatDate(selectedRequest.created_at)}
                    </p>
                  </div>

                  <div
                    className={`px-4 py-2 rounded-xl font-bold ${
                      selectedRequest.status === "reviewed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selectedRequest.status === "reviewed"
                      ? "Solicitud revisada"
                      : "Solicitud pendiente"}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="border rounded-2xl p-4 bg-gray-50 interactive-soft">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      Reporte del análisis
                    </h3>

                    {processedImage && (
                      <img
                        src={processedImage}
                        alt="Reporte análisis"
                        className="w-full rounded-xl bg-black object-contain max-h-[360px] image-zoom"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onMouseMove={handleMouseGlow}
                      className="bg-orange-50 rounded-xl p-4 interactive-card border border-orange-100"
                    >
                      <p className="text-sm text-gray-500">Temperatura</p>
                      <p className="text-xl font-bold text-orange-700">
                        {analysis?.hotpoint_temperature || 0} °C
                      </p>
                    </div>

                    <div
                      onMouseMove={handleMouseGlow}
                      className="bg-red-50 rounded-xl p-4 interactive-card border border-red-100"
                    >
                      <p className="text-sm text-gray-500">Riesgo</p>
                      <p className="text-xl font-bold text-red-700">
                        {analysis?.estimated_life?.nivel_riesgo || "N/A"}
                      </p>
                    </div>

                    <div
                      onMouseMove={handleMouseGlow}
                      className="bg-blue-50 rounded-xl p-4 interactive-card border border-blue-100"
                    >
                      <p className="text-sm text-gray-500">Vida útil</p>
                      <p className="text-xl font-bold text-blue-700">
                        {analysis?.estimated_life?.vida_util_estimada_anios ||
                          "N/A"}{" "}
                        años
                      </p>
                    </div>

                    <div
                      onMouseMove={handleMouseGlow}
                      className="bg-emerald-50 rounded-xl p-4 interactive-card border border-emerald-100"
                    >
                      <p className="text-sm text-gray-500">Panel</p>
                      <p className="text-sm font-bold text-emerald-700">
                        {analysis?.panel?.marca} {analysis?.panel?.modelo}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-2xl p-5 interactive-soft">
                  <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench size={22} />
                    Tareas de mantenimiento
                  </h3>

                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <div
                        key={index}
                        onMouseMove={handleMouseGlow}
                        className={`border rounded-xl p-4 interactive-card ${
                          task.completed
                            ? "bg-emerald-50 border-emerald-200 glow-active"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!task.completed}
                            disabled={selectedRequest.status === "reviewed"}
                            onChange={() => toggleTask(index)}
                            className="mt-1 w-5 h-5 accent-emerald-600"
                          />

                          <div className="flex-1">
                            <p className="font-bold text-gray-800">
                              {task.title}
                            </p>

                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                          </div>
                        </label>

                        <textarea
                          value={task.feedback || ""}
                          disabled={selectedRequest.status === "reviewed"}
                          onChange={(e) =>
                            updateTaskFeedback(index, e.target.value)
                          }
                          placeholder="Escribe la retroalimentación de esta tarea..."
                          className="mt-3 w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100 transition"
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Comentario final de revisión
                    </label>

                    <textarea
                      value={finalComment}
                      disabled={selectedRequest.status === "reviewed"}
                      onChange={(e) => setFinalComment(e.target.value)}
                      placeholder="Comentario general de la solicitud..."
                      className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100 transition"
                      rows={3}
                    />
                  </div>

                  {selectedRequest.status !== "reviewed" && (
                    <div className="flex flex-col md:flex-row gap-3 mt-5">
                      <button
                        onClick={saveTasks}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1 hover:shadow-lg active:scale-95 transition"
                      >
                        <Save size={20} />
                        Guardar avances
                      </button>

                      <button
                        onClick={handleReviewClick}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1 hover:shadow-lg active:scale-95 transition"
                      >
                        <ShieldCheck size={20} />
                        Marcar como revisada
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default MaintenanceDashboard;