def calculate_energy_loss(panel, hotpoint_temperature):
    nominal_power = panel.get("potencia_w", 450)
    optimal_temp = panel.get("temperatura_operacion_optima", 45)
    coefficient = abs(panel.get("coeficiente_temperatura_pmax", -0.29))

    delta_temp = max(0, hotpoint_temperature - optimal_temp)
    loss_percent = delta_temp * coefficient

    power_loss_w = nominal_power * (loss_percent / 100)
    effective_power_w = nominal_power - power_loss_w

    return {
        "potencia_nominal_w": round(nominal_power, 2),
        "temperatura_optima_c": optimal_temp,
        "delta_temperatura_c": round(delta_temp, 2),
        "porcentaje_perdida": round(loss_percent, 2),
        "perdida_potencia_w": round(power_loss_w, 2),
        "potencia_efectiva_w": round(effective_power_w, 2)
    }


def generate_network_report(panel, affected_panels):
    total_hotpoints = 0
    total_power_loss_w = 0
    max_temp = 0

    for affected in affected_panels:
        for hp in affected.get("hotpoints", []):
            total_hotpoints += 1
            max_temp = max(max_temp, hp.get("temperature", 0))

            loss = calculate_energy_loss(
                panel,
                hp.get("temperature", 0)
            )

            total_power_loss_w += loss["perdida_potencia_w"]

    nominal_power = panel.get("potencia_w", 450)

    if total_hotpoints == 0:
        inverter_status = "Normal"
    elif max_temp < 70:
        inverter_status = "Operación estable con alerta leve"
    elif max_temp < 90:
        inverter_status = "Alerta: reducción de eficiencia"
    else:
        inverter_status = "Crítico: riesgo de sobrecalentamiento"

    months = list(range(1, 13))

    efficiency_graph = []
    economic_loss_graph = []
    power_increase_graph = []

    energy_price_cop_kwh = 1000
    base_efficiency = 100

    for month in months:
        degradation = (
            total_power_loss_w / max(nominal_power, 1)
        ) * month * 1.4

        efficiency = max(55, base_efficiency - degradation)

        lost_kwh = (total_power_loss_w / 1000) * month * 30
        economic_loss = lost_kwh * energy_price_cop_kwh

        if max_temp > 45:
            power_stress = nominal_power + (max_temp - 45) * 2.5
        else:
            power_stress = nominal_power

        efficiency_graph.append({
            "time": f"Mes {month}",
            "efficiency": round(efficiency, 2)
        })

        economic_loss_graph.append({
            "time": f"Mes {month}",
            "lost_kwh": round(lost_kwh, 3),
            "loss_cop": round(economic_loss, 2)
        })

        power_increase_graph.append({
            "time": f"Mes {month}",
            "temperature": round(max_temp, 2),
            "power_stress_w": round(
                power_stress + month * total_hotpoints,
                2
            )
        })

    return {
        "estado_inversor": inverter_status,
        "total_hotpoints": total_hotpoints,
        "temperatura_maxima": round(max_temp, 2),
        "perdida_total_w": round(total_power_loss_w, 2),
        "perdida_total_kw": round(total_power_loss_w / 1000, 3),
        "precio_kwh_cop": energy_price_cop_kwh,
        "grafica_eficacia_red": efficiency_graph,
        "grafica_perdida_economica": economic_loss_graph,
        "grafica_aumento_potencia": power_increase_graph
    }