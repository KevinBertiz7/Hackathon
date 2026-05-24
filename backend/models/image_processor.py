import cv2
import numpy as np
import os
import random
from datetime import datetime


def image_to_matrix(image_path: str, size=(224, 224)):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("No se pudo leer la imagen.")

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_resized = cv2.resize(image_rgb, size)

    matrix = np.array(image_resized, dtype=np.float32) / 255.0

    return matrix


def save_matrix(matrix, folder="matrices", prefix="matrix"):
    os.makedirs(folder, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    path = os.path.join(folder, f"{prefix}_{timestamp}.npy")

    np.save(path, matrix)

    return path


def estimate_temperature_by_color(bgr_pixel):
    b, g, r = int(bgr_pixel[0]), int(bgr_pixel[1]), int(bgr_pixel[2])

    brightness = (r + g + b) / 3

    if r > 220 and g > 190:
        return round(95 + (brightness / 255) * 18, 2)

    if r > 200 and g > 140:
        return round(82 + (brightness / 255) * 15, 2)

    if r > 160 and g > 90:
        return round(68 + (brightness / 255) * 12, 2)

    return round(45 + (brightness / 255) * 15, 2)


def create_panel_mask(image):
    """
    Segmenta únicamente los paneles solares.
    Los paneles en tus imágenes son zonas naranjas/amarillas grandes.
    El fondo morado/azul queda eliminado.
    """

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    lower_orange = np.array([5, 80, 80])
    upper_orange = np.array([35, 255, 255])

    panel_mask = cv2.inRange(hsv, lower_orange, upper_orange)

    kernel_close = np.ones((17, 17), np.uint8)
    kernel_open = np.ones((7, 7), np.uint8)

    panel_mask = cv2.morphologyEx(panel_mask, cv2.MORPH_CLOSE, kernel_close)
    panel_mask = cv2.morphologyEx(panel_mask, cv2.MORPH_OPEN, kernel_open)

    contours, _ = cv2.findContours(
        panel_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE
    )

    clean_mask = np.zeros_like(panel_mask)
    image_area = image.shape[0] * image.shape[1]

    panels = []

    for contour in contours:
        area = cv2.contourArea(contour)

        if area < image_area * 0.025:
            continue

        x, y, w, h = cv2.boundingRect(contour)

        if w < 120 or h < 40:
            continue

        aspect_ratio = w / max(h, 1)

        if aspect_ratio < 1.5:
            continue

        cv2.drawContours(clean_mask, [contour], -1, 255, thickness=cv2.FILLED)

        panels.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "area": float(area)
        })

    return clean_mask, panels


def create_hotpoint_mask_inside_panels(image, panel_mask):
    """
    Detecta únicamente puntos amarillos/blancos pequeños dentro de los paneles.
    """

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    lower_yellow = np.array([20, 80, 160])
    upper_yellow = np.array([40, 255, 255])

    yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

    lower_white_hot = np.array([0, 0, 210])
    upper_white_hot = np.array([180, 90, 255])

    white_mask = cv2.inRange(hsv, lower_white_hot, upper_white_hot)

    hot_mask = cv2.bitwise_or(yellow_mask, white_mask)

    hot_mask = cv2.bitwise_and(hot_mask, panel_mask)

    kernel = np.ones((3, 3), np.uint8)
    hot_mask = cv2.morphologyEx(hot_mask, cv2.MORPH_OPEN, kernel)

    return hot_mask


def find_related_panel(center_x, center_y, panels):
    for panel in panels:
        x = panel["x"]
        y = panel["y"]
        w = panel["width"]
        h = panel["height"]

        if x <= center_x <= x + w and y <= center_y <= y + h:
            return panel

    return None

def build_crop_box_for_hotpoint(hp, panel, image_shape):
    image_h, image_w = image_shape[:2]

    cx = hp["center_x"]
    cy = hp["center_y"]

    crop_w = 260
    crop_h = 130

    x1 = max(0, cx - crop_w // 2)
    y1 = max(0, cy - crop_h // 2)
    x2 = min(image_w, cx + crop_w // 2)
    y2 = min(image_h, cy + crop_h // 2)

    if panel:
        px = panel["x"]
        py = panel["y"]
        pw = panel["width"]
        ph = panel["height"]

        x1 = max(px, x1)
        y1 = max(py, y1)
        x2 = min(px + pw, x2)
        y2 = min(py + ph, y2)

    if x2 - x1 < 80:
        x1 = max(0, cx - 100)
        x2 = min(image_w, cx + 100)

    if y2 - y1 < 60:
        y1 = max(0, cy - 60)
        y2 = min(image_h, cy + 60)

    return int(x1), int(y1), int(x2), int(y2)


def detect_hotpoints(image_path: str, output_folder="processed"):
    os.makedirs(output_folder, exist_ok=True)

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("No se pudo cargar la imagen.")

    original = image.copy()
    marked_image = image.copy()

    blurred = cv2.GaussianBlur(image, (3, 3), 0)

    panel_mask, panels = create_panel_mask(blurred)

    if len(panels) == 0:
        panel_mask = np.ones(image.shape[:2], dtype=np.uint8) * 255
        panels = [{
            "x": 0,
            "y": 0,
            "width": image.shape[1],
            "height": image.shape[0],
            "area": float(image.shape[0] * image.shape[1])
        }]

    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)

    kernel_tophat = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel_tophat)

    panel_pixels = tophat[panel_mask == 255]

    if panel_pixels.size > 0:
        mean_val = np.mean(panel_pixels)
        std_val = np.std(panel_pixels)
        dynamic_threshold = mean_val + (1.8 * std_val)
        dynamic_threshold = max(12, min(dynamic_threshold, 65))
    else:
        dynamic_threshold = 20

    _, binary_tophat = cv2.threshold(
        tophat,
        dynamic_threshold,
        255,
        cv2.THRESH_BINARY
    )

    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

    yellow_mask = cv2.inRange(
        hsv,
        np.array([14, 40, 110]),
        np.array([48, 255, 255])
    )

    white_mask = cv2.inRange(
        hsv,
        np.array([0, 0, 165]),
        np.array([180, 130, 255])
    )

    color_mask = cv2.bitwise_or(yellow_mask, white_mask)

    hot_mask = cv2.bitwise_and(binary_tophat, color_mask)
    hot_mask = cv2.bitwise_and(hot_mask, panel_mask)

    kernel = np.ones((2, 2), np.uint8)
    hot_mask = cv2.morphologyEx(hot_mask, cv2.MORPH_OPEN, kernel, iterations=1)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        hot_mask,
        8
    )

    all_points = []

    for i in range(1, num_labels):
        x = stats[i, cv2.CC_STAT_LEFT]
        y = stats[i, cv2.CC_STAT_TOP]
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]

        center_x, center_y = centroids[i]
        center_x = int(center_x)
        center_y = int(center_y)

        if area < 2 or area > 500:
            continue

        if w > 45 or h > 45:
            continue

        ratio = w / max(h, 1)

        if ratio > 4.0 or ratio < 0.25:
            continue

        related_panel = find_related_panel(center_x, center_y, panels)

        if related_panel is None:
            continue

        roi = image[y:y + h, x:x + w]

        if roi.size == 0:
            continue

        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        max_intensity = int(np.max(gray_roi))
        local_response = int(np.max(tophat[y:y + h, x:x + w]))

        pixel_position = np.unravel_index(
            np.argmax(gray_roi),
            gray_roi.shape
        )

        pixel = roi[pixel_position[0], pixel_position[1]]
        temperature = estimate_temperature_by_color(pixel)

        confidence = round(
            min(100, (local_response / max(dynamic_threshold, 1)) * 40),
            2
        )

        if max_intensity >= 165 or confidence >= 70:
            classification = "hotpoint"
        else:
            classification = "possible_hotpoint"

        all_points.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "center_x": int(center_x),
            "center_y": int(center_y),
            "temperature": temperature,
            "intensity": max_intensity,
            "local_response": local_response,
            "confidence": confidence,
            "classification": classification,
            "area": float(area),
            "panel": related_panel
        })

    all_points = sorted(
        all_points,
        key=lambda item: (item["classification"] == "hotpoint", item["confidence"]),
        reverse=True
    )

    detected_hotpoints = [
        p for p in all_points if p["classification"] == "hotpoint"
    ]

    possible_hotpoints = [
        p for p in all_points if p["classification"] == "possible_hotpoint"
    ]

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    affected_panels = []

    for index, hp in enumerate(all_points):
        color = (0, 255, 255)

        if hp["classification"] == "possible_hotpoint":
            color = (0, 180, 255)

        x1, y1, x2, y2 = build_crop_box_for_hotpoint(
            hp,
            hp.get("panel"),
            image.shape
        )

        cv2.rectangle(
            marked_image,
            (x1, y1),
            (x2, y2),
            (0, 0, 0),
            3
        )

        cv2.circle(
            marked_image,
            (hp["center_x"], hp["center_y"]),
            8,
            color,
            2
        )

        label = f'{hp["temperature"]} C'

        if hp["classification"] == "possible_hotpoint":
            label = f'Posible {hp["temperature"]} C'

        cv2.putText(
            marked_image,
            label,
            (hp["center_x"] + 8, max(20, hp["center_y"] - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            2
        )

        crop = original[y1:y2, x1:x2]
        crop_marked = crop.copy()

        local_x = hp["center_x"] - x1
        local_y = hp["center_y"] - y1

        cv2.circle(
            crop_marked,
            (local_x, local_y),
            8,
            color,
            2
        )

        cv2.putText(
            crop_marked,
            label,
            (local_x + 8, max(20, local_y - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            2
        )

        affected_name = f"affected_panel_{timestamp}_{index + 1}.jpg"
        affected_path = os.path.join(output_folder, affected_name)

        cv2.imwrite(affected_path, crop_marked)

        affected_panels.append({
            "id": index + 1,
            "image_path": affected_path,
            "panel_box": {
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1
            },
            "hotpoints": [hp],
            "main_hotpoint": hp,
            "classification": hp["classification"],
            "hotpoint_temperature": hp["temperature"]
        })

    output_path = os.path.join(output_folder, f"processed_{timestamp}.jpg")
    binary_path = os.path.join(output_folder, f"binary_{timestamp}.jpg")
    smooth_path = os.path.join(output_folder, f"smooth_{timestamp}.jpg")
    panel_mask_path = os.path.join(output_folder, f"panel_mask_{timestamp}.jpg")
    hot_mask_path = os.path.join(output_folder, f"hot_mask_{timestamp}.jpg")
    tophat_path = os.path.join(output_folder, f"tophat_{timestamp}.jpg")

    cv2.imwrite(output_path, marked_image)
    cv2.imwrite(binary_path, binary_tophat)
    cv2.imwrite(smooth_path, blurred)
    cv2.imwrite(panel_mask_path, panel_mask)
    cv2.imwrite(hot_mask_path, hot_mask)
    cv2.imwrite(tophat_path, tophat)

    return {
        "processed_image_path": output_path,
        "smooth_image_path": smooth_path,
        "binary_image_path": binary_path,
        "panel_mask_path": panel_mask_path,
        "hot_mask_path": hot_mask_path,
        "tophat_path": tophat_path,
        "hotpoint_detected": len(detected_hotpoints) > 0,
        "hotpoints": detected_hotpoints,
        "possible_hotpoints": possible_hotpoints,
        "all_points": all_points,
        "main_hotpoint": detected_hotpoints[0] if detected_hotpoints else all_points[0] if all_points else None,
        "affected_panels": affected_panels,
        "hotpoints_count": len(detected_hotpoints),
        "possible_hotpoints_count": len(possible_hotpoints)
    }

def generate_augmented_images(
    image_path: str,
    total_images: int = 20,
    output_folder="augmented"
):
    os.makedirs(output_folder, exist_ok=True)

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("No se pudo cargar la imagen para aumento.")

    augmented_data = []

    h, w = image.shape[:2]

    for i in range(total_images):
        augmented = image.copy()

        mode = random.choice([
            "move_hotpoint",
            "add_hotpoints",
            "without_hotpoint",
            "brightness",
            "noise"
        ])

        if mode == "without_hotpoint":
            panel_mask, _ = create_panel_mask(augmented)
            blurred = cv2.GaussianBlur(augmented, (11, 11), 0)
            augmented = np.where(panel_mask[:, :, None] == 255, blurred, augmented)

        elif mode == "add_hotpoints":
            panel_mask, panels = create_panel_mask(augmented)

            if panels:
                points = random.randint(1, 4)

                for _ in range(points):
                    panel = random.choice(panels)

                    px = panel["x"]
                    py = panel["y"]
                    pw = panel["width"]
                    ph = panel["height"]

                    cx = random.randint(px + 20, max(px + 21, px + pw - 20))
                    cy = random.randint(py + 15, max(py + 16, py + ph - 15))

                    radius = random.randint(5, 10)

                    cv2.circle(augmented, (cx, cy), radius, (0, 255, 255), -1)
                    cv2.circle(augmented, (cx, cy), max(2, radius // 2), (0, 0, 255), -1)

        elif mode == "move_hotpoint":
            panel_mask, panels = create_panel_mask(augmented)

            if panels:
                panel = random.choice(panels)

                px = panel["x"]
                py = panel["y"]
                pw = panel["width"]
                ph = panel["height"]

                cx = random.randint(px + 20, max(px + 21, px + pw - 20))
                cy = random.randint(py + 15, max(py + 16, py + ph - 15))

                cv2.circle(augmented, (cx, cy), 9, (0, 255, 255), -1)
                cv2.circle(augmented, (cx, cy), 4, (0, 0, 255), -1)

        elif mode == "brightness":
            alpha = random.uniform(0.9, 1.12)
            beta = random.randint(-10, 12)
            augmented = cv2.convertScaleAbs(augmented, alpha=alpha, beta=beta)

        elif mode == "noise":
            noise = np.random.normal(0, 4, augmented.shape).astype(np.int16)
            augmented = np.clip(
                augmented.astype(np.int16) + noise,
                0,
                255
            ).astype(np.uint8)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")

        image_name = f"augmented_{timestamp}_{i + 1}.jpg"
        image_output_path = os.path.join(output_folder, image_name)

        cv2.imwrite(image_output_path, augmented)

        matrix = image_to_matrix(image_output_path)
        matrix_path = save_matrix(matrix, prefix="augmented_matrix")

        augmented_data.append({
            "image_path": image_output_path,
            "matrix_path": matrix_path,
            "matrix_shape": list(matrix.shape),
            "augmentation_type": mode
        })

    return augmented_data