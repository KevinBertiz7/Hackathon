import os
import shutil
import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form

import firebase_config

from models.image_processor import (
    detect_hotpoints,
    image_to_matrix,
    save_matrix,
    generate_augmented_images
)
from models.life_estimator import estimate_life, component_recommendations
from models.energy_calculator import calculate_energy_loss, generate_network_report

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
    matrix_path = save_matrix(matrix, prefix="original_matrix")

    augmented_dataset = generate_augmented_images(
        image_path=image_path,
        total_images=20
    )

    result = detect_hotpoints(image_path)

    affected_panels_report = []

    for affected in result.get("affected_panels", []):
        main_hp = affected["main_hotpoint"]
        hotpoint_temp = main_hp["temperature"]

        life = estimate_life(
            panel_life=panel["vida_util_anios"],
            hotpoint_temp=hotpoint_temp
        )

        energy_loss = calculate_energy_loss(
            panel=panel,
            hotpoint_temperature=hotpoint_temp
        )

        recommendations = component_recommendations(hotpoint_temp)

        affected_panels_report.append({
            "id": affected["id"],
            "image_path": affected["image_path"],
            "panel_box": affected["panel_box"],
            "hotpoints": affected["hotpoints"],
            "main_hotpoint": main_hp,
            "hotpoint_temperature": hotpoint_temp,
            "estimated_life": life,
            "energy_loss": energy_loss,
            "recommendations": recommendations
        })

    main_hotpoint = result["main_hotpoint"]
    hotpoint_temp = main_hotpoint["temperature"] if main_hotpoint else 0

    general_life = estimate_life(
        panel_life=panel["vida_util_anios"],
        hotpoint_temp=hotpoint_temp
    )

    general_recommendations = component_recommendations(hotpoint_temp)

    network_report = generate_network_report(
        panel=panel,
        affected_panels=affected_panels_report
    )

    analysis_data = {
        "panel_id": panel_id,
        "panel": panel,
        "original_image_path": image_path,
        "original_matrix_path": matrix_path,
        "processed_image_path": result["processed_image_path"],
        "hotpoint_detected": result["hotpoint_detected"],
        "main_hotpoint": main_hotpoint,
        "hotpoints": result.get("hotpoints", []),
        "possible_hotpoints": result.get("possible_hotpoints", []),
        "all_points": result.get("all_points", []),
        "hotpoints_count": result.get("hotpoints_count", 0),
        "possible_hotpoints_count": result.get("possible_hotpoints_count", 0),
        "hotpoint_temperature": hotpoint_temp,
        "matrix_shape": list(matrix.shape),
        "affected_panels": affected_panels_report,
        "augmented_dataset": augmented_dataset,
        "augmented_total": len(augmented_dataset),
        "estimated_life": general_life,
        "recommendations": general_recommendations,
        "network_report": network_report,
        "created_at": datetime.now().isoformat()
    }

    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase DB no está inicializado."
        }

    try:
        doc_ref = firebase_config.db.collection("analysis_history").document()
        doc_ref.set(analysis_data)
        doc_id = doc_ref.id

        firebase_config.db.collection("image_dataset").document(doc_id).set({
            "analysis_id": doc_id,
            "original_matrix_path": matrix_path,
            "augmented_dataset": augmented_dataset,
            "total_augmented": len(augmented_dataset),
            "created_at": datetime.now().isoformat()
        })

    except Exception as e:
        return {
            "success": False,
            "message": "No se pudo guardar en Firestore",
            "error": str(e)
        }

    return {
        "success": True,
        "message": "Análisis realizado, dataset aumentado y guardado correctamente",
        "analysis_id": doc_id,
        "data": analysis_data
    }