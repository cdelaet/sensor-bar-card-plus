

# Sensor Bar Card Plus Recipes

These recipes demonstrate practical real-world use cases for Sensor Bar Card Plus.

Unlike the playground and showcase dashboards, the recipe collection focuses on reusable dashboard patterns that can be copied and adapted for your own Home Assistant setup.

Most recipes use demo helper entities from:

```text
examples/packages/sensor_bar_card_plus_playground_package.yaml
```

To use the recipes in your own dashboards, simply replace the demo `sensor.sbcp_*` entities with your own Home Assistant sensors.

The goal of these recipes is not just to show what the card *can* do, but to demonstrate where specific rendering modes and visualization concepts genuinely make sense.

Have fun and build something ridiculously pretty.

---

# Recipe Categories

## Energy

Practical energy and power-flow dashboards.

| Recipe | Description |
|---|---|
| `energy/battery-flow.yaml` | Battery charge/discharge telemetry with baseline-centered flows |
| `energy/grid-import-export.yaml` | Grid import/export visualization with per-phase telemetry |
| `energy/solar-production.yaml` | Solar production monitoring with semantic operating ranges |
| `energy/ev-charging.yaml` | EV charging telemetry and household load monitoring |

---

## Telemetry

Dense telemetry dashboards for infrastructure and technical monitoring.

| Recipe | Description |
|---|---|
| `telemetry/server-health.yaml` | Compact server and infrastructure monitoring |
| `telemetry/network-latency.yaml` | WAN latency, jitter, throughput, and network quality telemetry |
| `telemetry/dense-av-telemetry.yaml` | Dense AV and signal-processing style telemetry |

---

## Needle Gauges

Instrumentation-style dashboards using persistent full-scale rendering.

| Recipe | Description |
|---|---|
| `gauges/needle-gauge-basics.yaml` | Basic needle-style gauge rendering |
| `gauges/needle-soft-bands.yaml` | Needle mode combined with semantic soft bands |

---

## Baseline Rendering

Bidirectional telemetry and centered-flow visualization.

| Recipe | Description |
|---|---|
| `baseline/bidirectional-power.yaml` | Generic bidirectional power-flow visualization |
| `baseline/av-calibration.yaml` | AV calibration and centered telemetry metrics |

---

# Choosing The Right Rendering Mode

Sensor Bar Card Plus currently supports three major visualization models.

## Reveal Fill

Traditional bar behavior.

The fill grows from the minimum value toward the current value.

Best for:

- temperatures
- percentages
- storage usage
- solar production
- positive-only metrics

See:

- `energy/solar-production.yaml`
- `telemetry/server-health.yaml`

---

## Baseline Rendering

The fill grows away from a neutral reference point.

Best for:

- import/export flows
- charge/discharge power
- balance or offset values
- calibration telemetry
- directional metrics

See:

- `baseline/bidirectional-power.yaml`
- `baseline/av-calibration.yaml`
- `energy/grid-import-export.yaml`

---

## Needle Mode

The full scale remains visible while a needle indicates the current value.

Best for:

- instrumentation dashboards
- operating ranges
- comfort/risk scales
- VU-style telemetry
- persistent context visualization

See:

- `gauges/needle-gauge-basics.yaml`
- `gauges/needle-soft-bands.yaml`

---

# Notes

- Recipes intentionally avoid unnecessary default configuration.
- Unsupported or unrelated features are usually omitted to keep the examples focused.
- The recipe collection is intended to grow over time as new rendering concepts and visualization patterns are added.
- The showcase dashboards remain the best place to explore every feature and edge case.