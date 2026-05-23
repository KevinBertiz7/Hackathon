def estimate_life(panel_life: float, hotpoint_temp: float):
    """
    Estima vida útil restante del panel según temperatura del hotpoint.
    """

    if hotpoint_temp < 60:
        factor = 1.0
        risk = "Bajo"
    elif hotpoint_temp < 75:
        factor = 0.85
        risk = "Moderado"
    elif hotpoint_temp < 90:
        factor = 0.65
        risk = "Alto"
    else:
        factor = 0.45
        risk = "Crítico"

    estimated_life = round(panel_life * factor, 2)

    return {
        "vida_util_estimada_anios": estimated_life,
        "nivel_riesgo": risk
    }


def component_recommendations(temp: float):
    if temp >= 90:
        estado = "Crítico"
    elif temp >= 75:
        estado = "Alto"
    elif temp >= 60:
        estado = "Moderado"
    else:
        estado = "Bajo"

    return {
        "estado_general": estado,
        "recomendaciones": [
            {
                "componente": "Célula de silicio",
                "se_repara": "No",
                "decision": "Cambiar panel si el daño térmico es permanente."
            },
            {
                "componente": "Cristal roto",
                "se_repara": "No",
                "decision": "Cambiar panel. La humedad puede oxidar los contactos."
            },
            {
                "componente": "Caja de conexiones / diodos",
                "se_repara": "Sí",
                "decision": "Reparar. Un diodo de bypass dañado puede reemplazarse."
            },
            {
                "componente": "Cables o conectores MC4",
                "se_repara": "Sí",
                "decision": "Reparar. Es económico y puede recuperar el funcionamiento."
            }
        ]
    }