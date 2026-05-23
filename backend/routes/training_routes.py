from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime
import numpy as np

import firebase_config

from models.kohonen import KohonenSOM

router = APIRouter(prefix="/api/kohonen", tags=["Kohonen"])


class TrainRequest(BaseModel):
    data: List[List[float]]
    neurons: int
    iterations: int = 100
    neighborhood: float = 0.2
    competition: str = "soft"


class SimulateRequest(BaseModel):
    pattern: List[float]
    weights: List[List[float]]


@router.post("/train")
def train_kohonen(request: TrainRequest):
    input_dim = len(request.data[0])

    if request.neurons < input_dim * 2:
        return {
            "success": False,
            "message": f"El número de neuronas debe ser mínimo el doble de entradas: {input_dim * 2}"
        }

    som = KohonenSOM(
        input_dim=input_dim,
        neurons=request.neurons,
        iterations=request.iterations,
        neighborhood=request.neighborhood,
        competition=request.competition
    )

    result = som.train(request.data)

    training_data = {
        "input_dim": input_dim,
        "neurons": request.neurons,
        "iterations": request.iterations,
        "neighborhood": request.neighborhood,
        "competition": request.competition,
        "weights": result["weights"],
        "dm_history": result["dm_history"],
        "iterations_completed": result["iterations_completed"],
        "created_at": datetime.now().isoformat()
    }

    doc_id = None

    if firebase_config.db is not None:
        try:
            doc_ref = firebase_config.db.collection("kohonen_training").document()
            doc_ref.set(training_data)
            doc_id = doc_ref.id
            print(f"Entrenamiento guardado en Firestore con ID: {doc_id}")

        except Exception as e:
            return {
                "success": False,
                "message": "Entrenamiento realizado, pero no se pudo guardar en Firestore",
                "error": str(e),
                "result": training_data
            }

    return {
        "success": True,
        "message": "Entrenamiento Kohonen realizado correctamente",
        "training_id": doc_id,
        "result": training_data
    }


@router.post("/simulate")
def simulate_kohonen(request: SimulateRequest):
    input_dim = len(request.pattern)
    neurons = len(request.weights[0])

    som = KohonenSOM(
        input_dim=input_dim,
        neurons=neurons
    )

    som.weights = np.array(request.weights, dtype=float)

    result = som.simulate(request.pattern)

    return {
        "success": True,
        "message": "Simulación realizada correctamente",
        "result": result
    }