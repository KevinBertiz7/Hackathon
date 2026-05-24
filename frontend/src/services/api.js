import axios from "axios";

const API_URL = "http://localhost:8000";

export const backendUrl = API_URL;

export const api = axios.create({
  baseURL: API_URL,
});

// =============================
// PANELES
// =============================

export const getPanels = async () => {
  const response = await api.get("/api/panels/");
  return response.data.panels;
};

// =============================
// ANÁLISIS
// =============================

export const analyzeImage = async (panelId, imageFile) => {
  const formData = new FormData();
  formData.append("panel_id", panelId);
  formData.append("image", imageFile);

  const response = await api.post("/api/analysis/analyze-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// =============================
// HISTORIAL
// =============================

export const getHistory = async () => {
  const response = await api.get("/api/history/");
  return response.data.history;
};

export const getAnalysisById = async (id) => {
  const response = await api.get(`/api/history/${id}`);
  return response.data.analysis;
};

// =============================
// MANTENIMIENTO
// =============================

export const createMaintenanceRequest = async (payload) => {
  const response = await api.post("/api/maintenance/requests", payload);
  return response.data;
};

export const getMaintenanceRequests = async (status = "all") => {
  const response = await api.get(`/api/maintenance/requests?status=${status}`);
  return response.data;
};

export const getMaintenanceRequestById = async (requestId) => {
  const response = await api.get(`/api/maintenance/requests/${requestId}`);
  return response.data;
};

export const updateMaintenanceTasks = async (requestId, tasks) => {
  const response = await api.put(
    `/api/maintenance/requests/${requestId}/tasks`,
    {
      tasks,
    }
  );

  return response.data;
};

export const markMaintenanceAsReviewed = async (
  requestId,
  finalComment = ""
) => {
  const response = await api.put(
    `/api/maintenance/requests/${requestId}/review`,
    {
      final_comment: finalComment,
    }
  );

  return response.data;
};