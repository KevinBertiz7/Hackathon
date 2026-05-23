import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()

db = None
bucket = None


def init_firebase():
    global db, bucket

    if not firebase_admin._apps:
        key_path = os.getenv("FIREBASE_KEY_PATH")
        bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")

        if not key_path:
            raise Exception("FIREBASE_KEY_PATH no está configurado en .env")

        if not os.path.exists(key_path):
            raise Exception(f"No existe el archivo de Firebase: {key_path}")

        cred = credentials.Certificate(key_path)

        firebase_admin.initialize_app(cred, {
            "storageBucket": bucket_name
        })

    db = firestore.client()

    try:
        bucket = storage.bucket()
    except Exception as e:
        print("Storage no inicializado:", e)
        bucket = None

    return db, bucket