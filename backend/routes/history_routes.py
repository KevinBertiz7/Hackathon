from fastapi import APIRouter
import firebase_config

router = APIRouter(prefix="/api/history", tags=["Historial"])


@router.get("/")
def get_history():
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase DB no está inicializado"
        }

    try:
        docs = (
            firebase_config.db.collection("analysis_history")
            .order_by("created_at", direction="DESCENDING")
            .stream()
        )

        history = []

        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id
            history.append(item)

        return {
            "success": True,
            "history": history
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Error consultando historial",
            "error": str(e)
        }


@router.get("/{analysis_id}")
def get_analysis_by_id(analysis_id: str):
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase DB no está inicializado"
        }

    try:
        doc = firebase_config.db.collection("analysis_history").document(analysis_id).get()

        if not doc.exists:
            return {
                "success": False,
                "message": "Análisis no encontrado"
            }

        data = doc.to_dict()
        data["id"] = doc.id

        return {
            "success": True,
            "analysis": data
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Error consultando análisis",
            "error": str(e)
        }