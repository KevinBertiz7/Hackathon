import os
import shutil
import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form

import firebase_config

from models.image_processor import detect_hotpoints, image_to_matrix
from models.life_estimator import estimate_life, component_recommendations

router = APIRouter(prefix="/api/analysis", tags=["Análisis"])

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_panel(panel_id: str):
    with open("datasets/panel_specs.json", "r", encoding="utf-8") as file:
        panels = json.load(file)

    return next((panel for panel in panels if panel["id"] == panel_id), None)


@router.post("/analyze-image")
async def analyze_image(
    panel_id: str = Form(...),
    image: UploadFile = File(...)
):
    panel = get_panel(panel_id)

    if not panel:
        return {
            "success": False,
            "message": "Panel no encontrado"
        }

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{image.filename}"
    image_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    matrix = image_to_matrix(image_path)
    result = detect_hotpoints(image_path)

    main_hotpoint = result["main_hotpoint"]
    hotpoint_temp = main_hotpoint["temperature"] if main_hotpoint else 0

    life = estimate_life(
        panel_life=panel["vida_util_anios"],
        hotpoint_temp=hotpoint_temp
    )

    recommendations = component_recommendations(hotpoint_temp)

    analysis_data = {
        "panel_id": panel_id,
        "panel": panel,
        "original_image_path": image_path,
        "processed_image_path": result["processed_image_path"],
        "affected_panel_path": result["affected_panel_path"],
        "hotpoint_detected": result["hotpoint_detected"],
        "main_hotpoint": main_hotpoint,
        "possible_hotpoints": result["hotpoints"],
        "hotpoint_temperature": hotpoint_temp,
        "matrix_shape": list(matrix.shape),
        "estimated_life": life,
        "recommendations": recommendations,
        "created_at": datetime.now().isoformat()
    }

    doc_id = None

    if firebase_config.db is None:
        print("ERROR: Firebase DB no está inicializado")
        return {
            "success": False,
            "message": "Firebase DB no está inicializado. Revisa firebase-key.json, .env y main.py."
        }

    try:
        doc_ref = firebase_config.db.collection("analysis_history").document()
        doc_ref.set(analysis_data)
        doc_id = doc_ref.id
        print(f"Análisis guardado en Firestore con ID: {doc_id}")

    except Exception as e:
        print("ERROR guardando en Firestore:", e)
        return {
            "success": False,
            "message": "No se pudo guardar en Firestore",
            "error": str(e)
        }

    return {
        "success": True,
        "message": "Análisis realizado y guardado correctamente",
        "analysis_id": doc_id,
        "data": analysis_data
    }