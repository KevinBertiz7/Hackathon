import json
from datetime import datetime
from fastapi import APIRouter, Body

import firebase_config

router = APIRouter(prefix="/api/maintenance", tags=["Mantenimiento"])


def clean_firestore_data(data):
    return json.loads(json.dumps(data, default=str))


@router.post("/requests")
async def create_maintenance_request(payload: dict = Body(...)):
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase no está inicializado"
        }

    analysis_id = payload.get("analysis_id")
    analysis_data = payload.get("analysis_data")
    tasks = payload.get("tasks", [])

    if not analysis_id or not analysis_data:
        return {
            "success": False,
            "message": "Falta analysis_id o analysis_data"
        }

    existing = firebase_config.db.collection("maintenance_requests") \
        .where("analysis_id", "==", analysis_id) \
        .limit(1) \
        .stream()

    for doc in existing:
        return {
            "success": False,
            "message": "Ya existe una solicitud de mantenimiento para este análisis",
            "request_id": doc.id
        }

    request_data = {
        "analysis_id": analysis_id,
        "analysis_data": analysis_data,
        "panel": analysis_data.get("panel", {}),
        "status": "pending",
        "tasks": tasks,
        "created_at": datetime.now().isoformat(),
        "reviewed_at": None
    }

    request_data = clean_firestore_data(request_data)

    doc_ref = firebase_config.db.collection("maintenance_requests").document()
    doc_ref.set(request_data)

    firebase_config.db.collection("analysis_history").document(analysis_id).set(
        {
            "maintenance_status": "pending",
            "maintenance_request_id": doc_ref.id
        },
        merge=True
    )

    return {
        "success": True,
        "message": "Solicitud de mantenimiento creada correctamente",
        "request_id": doc_ref.id,
        "data": request_data
    }


@router.get("/requests")
async def get_maintenance_requests(status: str = "all"):
    if firebase_config.db is None:
        return []

    query = firebase_config.db.collection("maintenance_requests")

    if status in ["pending", "reviewed"]:
        query = query.where("status", "==", status)

    docs = query.stream()

    requests = []

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        requests.append(data)

    requests.sort(
        key=lambda item: item.get("created_at", ""),
        reverse=True
    )

    return requests


@router.get("/requests/{request_id}")
async def get_maintenance_request_by_id(request_id: str):
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase no está inicializado"
        }

    doc = firebase_config.db.collection("maintenance_requests").document(request_id).get()

    if not doc.exists:
        return {
            "success": False,
            "message": "Solicitud no encontrada"
        }

    data = doc.to_dict()
    data["id"] = doc.id

    return {
        "success": True,
        "data": data
    }


@router.put("/requests/{request_id}/tasks")
async def update_maintenance_tasks(request_id: str, payload: dict = Body(...)):
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase no está inicializado"
        }

    tasks = payload.get("tasks", [])

    firebase_config.db.collection("maintenance_requests").document(request_id).set(
        {
            "tasks": clean_firestore_data(tasks),
            "updated_at": datetime.now().isoformat()
        },
        merge=True
    )

    return {
        "success": True,
        "message": "Tareas actualizadas correctamente"
    }


@router.put("/requests/{request_id}/review")
async def mark_request_as_reviewed(request_id: str, payload: dict = Body(default={})):
    if firebase_config.db is None:
        return {
            "success": False,
            "message": "Firebase no está inicializado"
        }

    request_ref = firebase_config.db.collection("maintenance_requests").document(request_id)
    request_doc = request_ref.get()

    if not request_doc.exists:
        return {
            "success": False,
            "message": "Solicitud no encontrada"
        }

    request_data = request_doc.to_dict()
    analysis_id = request_data.get("analysis_id")

    request_ref.set(
        {
            "status": "reviewed",
            "reviewed_at": datetime.now().isoformat(),
            "final_comment": payload.get("final_comment", "")
        },
        merge=True
    )

    if analysis_id:
        firebase_config.db.collection("analysis_history").document(analysis_id).set(
            {
                "maintenance_status": "reviewed",
                "maintenance_request_id": request_id,
                "maintenance_reviewed_at": datetime.now().isoformat()
            },
            merge=True
        )

    return {
        "success": True,
        "message": "Solicitud marcada como revisada correctamente"
    }