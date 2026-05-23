import cv2
import numpy as np
import os
from datetime import datetime


def image_to_matrix(image_path: str, size=(224, 224)):
    image = cv2.imread(image_path)


    if image is None:
        raise ValueError("No se pudo leer la imagen.")

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_resized = cv2.resize(image_rgb, size)
    matrix = np.array(image_resized, dtype=np.float32) / 255.0

    return matrix


def estimate_temperature_from_pixel(pixel_value: int):
    """
    Estimación simple para hackathon.
    En una cámara térmica real se debe calibrar con escala térmica.
    """
    min_temp = 25
    max_temp = 110

    temp = min_temp + (pixel_value / 255) * (max_temp - min_temp)
    return round(float(temp), 2)


def detect_hotpoints(image_path: str, output_folder="processed"):
    os.makedirs(output_folder, exist_ok=True)

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("No se pudo cargar la imagen.")

    original = image.copy()

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    _, otsu = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    kernel = np.ones((5, 5), np.uint8)
    morph = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(
        morph,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    hotpoints = []

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < 80:
            continue

        x, y, w, h = cv2.boundingRect(contour)

        roi_gray = gray[y:y+h, x:x+w]
        max_pixel = int(np.max(roi_gray))
        temperature = estimate_temperature_from_pixel(max_pixel)

        if temperature >= 55:
            hotpoints.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "temperature": temperature,
                "area": float(area)
            })

            color = (0, 0, 255) if temperature >= 75 else (0, 165, 255)

            cv2.rectangle(original, (x, y), (x + w, y + h), color, 2)
            cv2.putText(
                original,
                f"{temperature} C",
                (x, y - 8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2
            )

    hotpoints = sorted(
        hotpoints,
        key=lambda item: item["temperature"],
        reverse=True
    )

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_name = f"processed_{timestamp}.jpg"
    output_path = os.path.join(output_folder, output_name)

    cv2.imwrite(output_path, original)

    affected_panel_path = None

    if hotpoints:
        main = hotpoints[0]
        x = main["x"]
        y = main["y"]
        w = main["width"]
        h = main["height"]

        margin = 60

        y1 = max(0, y - margin)
        y2 = min(image.shape[0], y + h + margin)
        x1 = max(0, x - margin)
        x2 = min(image.shape[1], x + w + margin)

        affected = original[y1:y2, x1:x2]

        affected_name = f"affected_panel_{timestamp}.jpg"
        affected_panel_path = os.path.join(output_folder, affected_name)

        cv2.imwrite(affected_panel_path, affected)

    return {
        "processed_image_path": output_path,
        "affected_panel_path": affected_panel_path,
        "hotpoint_detected": len(hotpoints) > 0,
        "hotpoints": hotpoints,
        "main_hotpoint": hotpoints[0] if hotpoints else None
    }