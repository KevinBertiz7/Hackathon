import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Clock,
  Wrench,
  Save,
  ShieldCheck,
  FileText,
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

function MaintenanceDashboard({ onBack }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewedRequests, setReviewedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [tasks, setTasks] = useState([]);
  const [finalComment, setFinalComment] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const pending = await getMaintenanceRequests("pending");
      const reviewed = await getMaintenanceRequests("reviewed");

      setPendingRequests(Array.isArray(pending) ? pending : []);
      setReviewedRequests(Array.isArray(reviewed) ? reviewed : []);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
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
      alert("Tareas guardadas correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar las tareas.");
    } finally {
      setLoading(false);
    }
  };

  const reviewRequest = async () => {
    if (!selectedRequest) return;

    const confirmReview = confirm(
      "¿Seguro que deseas marcar esta solicitud como revisada?"
    );

    if (!confirmReview) return;

    try {
      setLoading(true);

      await updateMaintenanceTasks(selectedRequest.id, tasks);
      await markMaintenanceAsReviewed(selectedRequest.id, finalComment);

      setSelectedRequest(null);
      setTasks([]);
      setFinalComment("");

      await loadRequests();

      alert("Solicitud marcada como revisada.");
    } catch (error) {
      console.error(error);
      alert("No se pudo marcar como revisada.");
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
      <header className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Área de Mantenimiento
            </h1>
            <p className="text-emerald-100 mt-1">
              Gestión de solicitudes generadas desde los análisis térmicos
            </p>
          </div>

          <button
            onClick={onBack}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Volver al análisis
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-500">Solicitudes pendientes</p>
            <p className="text-4xl font-extrabold text-amber-600">
              {pendingRequests.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-500">Solicitudes revisadas</p>
            <p className="text-4xl font-extrabold text-emerald-600">
              {reviewedRequests.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm text-gray-500">Estado del módulo</p>
            <p className="text-xl font-extrabold text-gray-800">
              Mantenimiento activo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setSelectedRequest(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  activeTab === "pending"
                    ? "bg-amber-500 text-white"
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
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  activeTab === "reviewed"
                    ? "bg-emerald-600 text-white"
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
                    className={`w-full text-left border rounded-xl p-4 hover:bg-emerald-50 transition ${
                      selectedRequest?.id === request.id
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200"
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

          <section className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            {!selectedRequest ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-gray-500">
                <ClipboardList size={60} className="mb-3 text-gray-300" />
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
                  <div className="border rounded-2xl p-4 bg-gray-50">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      Reporte del análisis
                    </h3>

                    {processedImage && (
                      <img
                        src={processedImage}
                        alt="Reporte análisis"
                        className="w-full rounded-xl bg-black object-contain max-h-[360px]"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Temperatura</p>
                      <p className="text-xl font-bold text-orange-700">
                        {analysis?.hotpoint_temperature || 0} °C
                      </p>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Riesgo</p>
                      <p className="text-xl font-bold text-red-700">
                        {analysis?.estimated_life?.nivel_riesgo || "N/A"}
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Vida útil</p>
                      <p className="text-xl font-bold text-blue-700">
                        {analysis?.estimated_life?.vida_util_estimada_anios ||
                          "N/A"}{" "}
                        años
                      </p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">Panel</p>
                      <p className="text-sm font-bold text-emerald-700">
                        {analysis?.panel?.marca} {analysis?.panel?.modelo}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-2xl p-5">
                  <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench size={22} />
                    Tareas de mantenimiento
                  </h3>

                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <div
                        key={index}
                        className={`border rounded-xl p-4 ${
                          task.completed
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!task.completed}
                            disabled={selectedRequest.status === "reviewed"}
                            onChange={() => toggleTask(index)}
                            className="mt-1 w-5 h-5"
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
                          className="mt-3 w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100"
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
                      className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-gray-100"
                      rows={3}
                    />
                  </div>

                  {selectedRequest.status !== "reviewed" && (
                    <div className="flex flex-col md:flex-row gap-3 mt-5">
                      <button
                        onClick={saveTasks}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save size={20} />
                        Guardar avances
                      </button>

                      <button
                        onClick={reviewRequest}
                        disabled={loading}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
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