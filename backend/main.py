from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

import firebase_config

from routes.panel_routes import router as panel_router
from routes.analysis_routes import router as analysis_router
from routes.history_routes import router as history_router
from routes.training_routes import router as training_router

os.makedirs("uploads", exist_ok=True)
os.makedirs("processed", exist_ok=True)

app = FastAPI(
    title="SolarHotIA API",
    description="API para detección de hot points en sistemas fotovoltaicos usando IA, procesamiento de imágenes y mapas de Kohonen.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    firebase_config.init_firebase()
    print("Firebase inicializado correctamente")
except Exception as e:
    print("Firebase no inicializado:", e)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/processed", StaticFiles(directory="processed"), name="processed")

app.include_router(panel_router)
app.include_router(analysis_router)
app.include_router(history_router)
app.include_router(training_router)


@app.get("/")
def home():
    return {
        "message": "SolarHotIA API funcionando correctamente",
        "swagger": "/docs",
        "firebase_db": firebase_config.db is not None
    }