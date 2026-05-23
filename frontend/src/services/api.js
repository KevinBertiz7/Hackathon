import axios from "axios";

const API_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
});

export const getPanels = async () => {
  const response = await api.get("/api/panels/");
  return response.data.panels;
};

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

export const getHistory = async () => {
  const response = await api.get("/api/history/");
  return response.data.history;
};

export const getAnalysisById = async (id) => {
  const response = await api.get(`/api/history/${id}`);
  return response.data.analysis;
};

export const backendUrl = API_URL;