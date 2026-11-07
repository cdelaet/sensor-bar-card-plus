# Optional Historical Extrema Helper Sensors

This is an optional advanced Home Assistant package that exposes historical minimum, maximum, and delta sensors; its YAML is in [`packages/sbcp_historical_extrema_package.yaml`](packages/sbcp_historical_extrema_package.yaml). It is not required for SBCP Peak/Floor markers: since v1.10, those markers read Home Assistant Recorder-backed history directly. Use this package when other Home Assistant features need extrema as sensor entities, when you need a reusable max-minus-min delta, or when an automation must select the calculation window programmatically.

## Included temperature sources

| Room | Source entity |
| --- | --- |
| Kitchen | `sensor.keuken_temperature` |
| Office Downstairs | `sensor.bureau_temperature` |
| Storage Room | `sensor.berging_temperature` |
| Hallway Upstairs | `sensor.nachthal_boven_temperature` |
| Attic | `sensor.zolder_onder_cv_temperature` |
| Garage | `sensor.garage_onder_pomp_temperature` |

For every source, the package creates a historical minimum, maximum, and delta (`maximum - minimum`).

If a period has a minimum of **20.2 °C** and maximum of **20.7 °C**, the delta is **0.5 °C**.

## Period selector

The package creates `input_select.sbcp_extrema_period`.

Calendar periods:
- `Today`
- `Yesterday`
- `This week`
- `This month`
- `This year`

`This week` starts Monday at 00:00 in Home Assistant local time.

Rolling periods:
- `Last hour`
- `Last 12 hours`
- `Last 24 hours`
- `Last 7 days`
- `Last 30 days`

`This week` and `Last 7 days` are intentionally different: the former is a calendar period; the latter is a rolling window.

## Using the dropdown

Add `input_select.sbcp_extrema_period` to a dashboard to select the period interactively.

You do not have to show it anywhere. It remains a normal Home Assistant entity and can be controlled by scripts and automations while hidden from dashboards.

## Setting the startup default in YAML

Add `initial:` to the `input_select`:

```yaml
input_select:
  sbcp_extrema_period:
    name: SBCP extrema period
    options:
      - "Today"
      - "Yesterday"
      - "This week"
      - "This month"
      - "This year"
      - "Last hour"
      - "Last 12 hours"
      - "Last 24 hours"
      - "Last 7 days"
      - "Last 30 days"
    initial: "This week"
    icon: mdi:calendar-clock
```

If you prefer Home Assistant to restore the helper's previous state after restart, leave `initial:` out.

## Changing the period programmatically

Use `input_select.select_option`:

```yaml
action:
  - action: input_select.select_option
    target:
      entity_id: input_select.sbcp_extrema_period
    data:
      option: "Last 24 hours"
```

Changing the helper from the dashboard, a script, or an automation triggers recalculation.

## Generated entities

| Room | Minimum | Maximum | Delta |
| --- | --- | --- | --- |
| Kitchen | `sensor.sbcp_kitchen_historical_min` | `sensor.sbcp_kitchen_historical_max` | `sensor.sbcp_kitchen_historical_delta` |
| Office Downstairs | `sensor.sbcp_office_downstairs_historical_min` | `sensor.sbcp_office_downstairs_historical_max` | `sensor.sbcp_office_downstairs_historical_delta` |
| Storage Room | `sensor.sbcp_storage_room_historical_min` | `sensor.sbcp_storage_room_historical_max` | `sensor.sbcp_storage_room_historical_delta` |
| Hallway Upstairs | `sensor.sbcp_hallway_upstairs_historical_min` | `sensor.sbcp_hallway_upstairs_historical_max` | `sensor.sbcp_hallway_upstairs_historical_delta` |
| Attic | `sensor.sbcp_attic_historical_min` | `sensor.sbcp_attic_historical_max` | `sensor.sbcp_attic_historical_delta` |
| Garage | `sensor.sbcp_garage_historical_min` | `sensor.sbcp_garage_historical_max` | `sensor.sbcp_garage_historical_delta` |

Delta is `maximum - minimum`, rounded to one decimal place.

Keep the delta sensor numeric and its unit as `°C`. Do not embed `Δ` into its state. SBCP can format the numeric value and unit, while `Δ` is presentation text.

## SBCP Reference Markers

Use the min/max entities as entity-backed Reference Markers, for example:

```yaml
markers:
  - at:
      entity: sensor.sbcp_kitchen_historical_max
    lane: above
    shape: triangle
    direction: inward
    label:
      show: true
      text: Max
      show_value: true
      show_unit: true
      precision: 1

  - at:
      entity: sensor.sbcp_kitchen_historical_min
    lane: below
    shape: triangle
    direction: inward
    label:
      show: true
      text: Min
      show_value: true
      show_unit: true
      precision: 1
```

If the selector is fixed to `This week`, labels such as `Weekly max` and `Weekly min` are appropriate. If the period can change, `Max` and `Min` avoid misleading labels.

## Delta as SBCP secondary information

For Kitchen, use:

`sensor.sbcp_kitchen_historical_delta`

The intended presentation is:

```text
Δ 0.5 °C
```

The Home Assistant entity itself remains simply a numeric temperature value such as `0.5` with unit `°C`.

## Adapting the pattern to other sensors

The extrema calculation is not temperature-specific. The same pattern can be used for:

- Ookla/Speedtest download and upload speed
- grid power
- solar production
- battery power or SoC
- CPU temperature
- humidity
- network latency

For another source, add it to the Recorder statistics request and create corresponding min/max/delta template sensors with the appropriate unit/device metadata.

For example:

```text
sensor.sbcp_download_historical_min
sensor.sbcp_download_historical_max
sensor.sbcp_download_historical_delta
```

Delta always means `max - min` in the source sensor's unit.

## SBCP Peak/Floor and these helper sensors

Since v1.10, SBCP Peak and Floor calculate extrema from configured Home Assistant Recorder-backed calendar or rolling windows. They can recover after a dashboard reload when the requested Recorder history or compatible long-term statistics are retained. Use those markers directly when their supported windows and coverage meet your needs.

This package remains useful when you also need a reusable Home Assistant min/max/delta entity, a value for automations or other cards, or custom aggregation outside SBCP's supported history sources and windows. Its Reference Marker examples can display those externally calculated entities. See the [SBCP history-window and coverage reference](../docs/configuration.md#peak-and-floor-history-windows) before relying on a period: a Recorder response does not guarantee complete retention, and attributes do not have long-term statistics.

## Notes

The source entities need suitable Recorder/statistics data.

The package refreshes periodically and when the period selector changes. Recorder statistics may use aggregated data depending on the period and retention, so extrema from aggregated statistics are not necessarily identical to extrema calculated from every raw historical state.

Validate the package on the target Home Assistant version before publishing it as an official SBCP recipe.
