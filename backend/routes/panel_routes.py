import json
from fastapi import APIRouter

router = APIRouter(prefix="/api/panels", tags=["Paneles"])


@router.get("/")
def get_panels():
    with open("datasets/panel_specs.json", "r", encoding="utf-8") as file:
        data = json.load(file)

    return {
        "success": True,
        "panels": data
    }


@router.get("/{panel_id}")
def get_panel_by_id(panel_id: str):
    with open("datasets/panel_specs.json", "r", encoding="utf-8") as file:
        data = json.load(file)

    panel = next((item for item in data if item["id"] == panel_id), None)

    if not panel:
        return {
            "success": False,
            "message": "Panel no encontrado"
        }

    return {
        "success": True,
        "panel": panel
    }