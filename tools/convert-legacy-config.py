#!/usr/bin/env python3
"""Convert legacy Sensor Bar Card Plus Lovelace YAML to structured config."""

from __future__ import annotations

import argparse
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

try:
    from ruamel.yaml import YAML
    from ruamel.yaml.comments import CommentedMap, CommentedSeq
except ModuleNotFoundError as exc:  # pragma: no cover - startup guard
    if exc.name and exc.name.startswith("ruamel"):
        print(
            "Missing dependency: ruamel.yaml\n"
            "Install it with: pip install ruamel.yaml",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc
    raise


SBCP_TYPE = "custom:sensor-bar-card-plus"
FLAT_KEYS = {
    "label_position",
    "label_width",
    "height",
    "min",
    "min_entity",
    "max",
    "max_entity",
    "decimal",
    "unit",
    "target_entity",
    "target_color",
    "show_target_label",
    "above_target_color",
    "show_peak",
    "peak_color",
    "color_mode",
    "color",
    "gradient_stops",
    "severity",
    "segments",
    "animated",
    "segment_space",
}
ENTITY_PREFIXES = (
    "sensor.",
    "binary_sensor.",
    "number.",
    "select.",
    "switch.",
    "light.",
    "climate.",
    "cover.",
    "fan.",
    "media_player.",
    "person.",
    "zone.",
    "device_tracker.",
    "automation.",
    "script.",
    "counter.",
    "timer.",
    "input_",
)

FILL_STYLE_BY_COLOR_MODE = {
    "single": "solid",
    "gradient": "gradient",
    "severity": "bands",
    "severity_gradient": "band_gradient",
}


yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 4096


def is_mapping(value: Any) -> bool:
    return isinstance(value, CommentedMap)


def is_sequence(value: Any) -> bool:
    return isinstance(value, CommentedSeq)


def clone(value: Any) -> Any:
    return deepcopy(value)


def is_entity_like_string(value: Any) -> bool:
    return isinstance(value, str) and value.strip().startswith(ENTITY_PREFIXES)


def read_yaml(path: str | None) -> Any:
    if path:
        with open(path, "r", encoding="utf-8") as handle:
            return yaml.load(handle)
    return yaml.load(sys.stdin)


def write_yaml(data: Any, path: str | None) -> None:
    if path:
        with open(path, "w", encoding="utf-8") as handle:
            yaml.dump(data, handle)
        return
    yaml.dump(data, sys.stdout)


def normalize_resolvable_input(raw: Any, entity_override: Any = None) -> CommentedMap:
    result = CommentedMap()
    if is_mapping(raw):
        if "entity" in raw:
            result["entity"] = clone(raw["entity"])
        if "percent" in raw:
            result["percent"] = clone(raw["percent"])
        if "fixed" in raw:
            result["fixed"] = clone(raw["fixed"])
        elif "value" in raw:
            result["fixed"] = clone(raw["value"])
    elif raw is not None:
        if isinstance(raw, str) and raw.strip().endswith("%"):
            result["percent"] = clone(raw)
        elif is_entity_like_string(raw):
            result["entity"] = clone(raw)
        else:
            result["fixed"] = clone(raw)
    if entity_override is not None and "entity" not in result:
        result["entity"] = clone(entity_override)
    return result


def normalize_segment_sequence(segments: Any) -> CommentedSeq:
    out = CommentedSeq()
    for segment in segments:
        if not is_mapping(segment):
            out.append(clone(segment))
            continue
        normalized = CommentedMap()
        for key in ("from", "to", "color", "label"):
            if key in segment:
                normalized[key] = clone(segment[key])
        out.append(normalized)
    return out


def color_mode_to_fill_style(color_mode: Any) -> Any:
    return FILL_STYLE_BY_COLOR_MODE.get(color_mode, color_mode)


def severity_to_segments(severity: Any) -> CommentedSeq:
    out = CommentedSeq()
    for segment in severity:
        normalized = CommentedMap()
        if "from" in segment:
            normalized["from"] = f"{segment['from']}%"
        if "to" in segment:
            normalized["to"] = f"{segment['to']}%"
        if "color" in segment:
            normalized["color"] = clone(segment["color"])
        if "label" in segment:
            normalized["label"] = clone(segment["label"])
        out.append(normalized)
    return out


def build_layout(config: CommentedMap) -> CommentedMap:
    structured = clone(config["layout"]) if is_mapping(config.get("layout")) else CommentedMap()
    label = clone(structured["label"]) if is_mapping(structured.get("label")) else CommentedMap()
    if "label_position" in config and "position" not in label:
        label["position"] = clone(config["label_position"])
    if "label_width" in config and "width" not in label:
        label["width"] = clone(config["label_width"])
    if label:
        structured["label"] = label
    if "height" in config and "height" not in structured:
        structured["height"] = clone(config["height"])
    return structured


def build_scale(config: CommentedMap) -> CommentedMap:
    structured = clone(config["scale"]) if is_mapping(config.get("scale")) else CommentedMap()
    if "min" not in structured and ("min" in config or "min_entity" in config):
        structured["min"] = normalize_resolvable_input(config.get("min"), config.get("min_entity"))
    elif "min" in structured:
        entity_override = structured["min"].get("entity") if is_mapping(structured["min"]) else None
        if "min_entity" in config and entity_override is None:
            entity_override = config["min_entity"]
        structured["min"] = normalize_resolvable_input(structured["min"], entity_override)
    if "max" not in structured and ("max" in config or "max_entity" in config):
        structured["max"] = normalize_resolvable_input(config.get("max"), config.get("max_entity"))
    elif "max" in structured:
        entity_override = structured["max"].get("entity") if is_mapping(structured["max"]) else None
        if "max_entity" in config and entity_override is None:
            entity_override = config["max_entity"]
        structured["max"] = normalize_resolvable_input(structured["max"], entity_override)
    return structured


def build_formatting(config: CommentedMap) -> CommentedMap:
    structured = clone(config["formatting"]) if is_mapping(config.get("formatting")) else CommentedMap()
    if "decimal" in config and "decimal" not in structured:
        structured["decimal"] = clone(config["decimal"])
    if "unit" in config and "unit" not in structured:
        structured["unit"] = clone(config["unit"])
    return structured


def build_target(config: CommentedMap) -> CommentedMap:
    structured = clone(config["target"]) if is_mapping(config.get("target")) else CommentedMap()
    if "target" in config and not is_mapping(config["target"]) and "at" not in structured:
        structured["at"] = normalize_resolvable_input(config["target"])
    elif "at" in structured:
        structured["at"] = normalize_resolvable_input(structured["at"])
    if "target_entity" in config:
        base = structured.get("at")
        structured["at"] = (
            normalize_resolvable_input(base, config["target_entity"])
            if base is not None
            else normalize_resolvable_input(None, config["target_entity"])
        )
    if "target_color" in config and "color" not in structured:
        structured["color"] = clone(config["target_color"])
    if "show_target_label" in config:
        label = clone(structured["label"]) if is_mapping(structured.get("label")) else CommentedMap()
        if "show" not in label:
            label["show"] = clone(config["show_target_label"])
        structured["label"] = label
    if "above_target_color" in config:
        when_exceeded = (
            clone(structured["when_exceeded"])
            if is_mapping(structured.get("when_exceeded"))
            else CommentedMap()
        )
        if "fill_color" not in when_exceeded:
            when_exceeded["fill_color"] = clone(config["above_target_color"])
        structured["when_exceeded"] = when_exceeded
    return structured


def build_peak(config: CommentedMap) -> CommentedMap:
    structured = clone(config["peak"]) if is_mapping(config.get("peak")) else CommentedMap()
    if "show_peak" in config and "enabled" not in structured:
        structured["enabled"] = clone(config["show_peak"])
    if "peak_color" in config and "color" not in structured:
        structured["color"] = clone(config["peak_color"])
    return structured


def build_bar(config: CommentedMap) -> CommentedMap:
    structured = clone(config["bar"]) if is_mapping(config.get("bar")) else CommentedMap()
    if "fill_style" not in structured:
        structured_color_mode = structured.pop("color_mode", None)
        flat_color_mode = config.get("color_mode")
        effective_color_mode = structured_color_mode if structured_color_mode is not None else flat_color_mode
        if effective_color_mode is not None:
            structured["fill_style"] = color_mode_to_fill_style(effective_color_mode)
    else:
        structured.pop("color_mode", None)

    for key in ("color", "gradient_stops", "animated", "segment_space"):
        if key in config and key not in structured:
            structured[key] = clone(config[key])
    if "segments" not in structured:
        if "segments" in config:
            structured["segments"] = normalize_segment_sequence(config["segments"])
        elif "severity" in config:
            structured["segments"] = severity_to_segments(config["severity"])
            structured.setdefault("fill_style", "bands")
    elif is_sequence(structured["segments"]):
        structured["segments"] = normalize_segment_sequence(structured["segments"])
    return structured


def build_baseline(config: CommentedMap) -> CommentedMap | None:
    if "baseline" not in config:
        return None
    raw = config["baseline"]
    structured = CommentedMap()
    if is_mapping(raw):
        if "at" in raw:
            structured["at"] = normalize_resolvable_input(raw["at"])
        if "above" in raw:
            structured["above"] = clone(raw["above"]) if is_mapping(raw["above"]) else CommentedMap(color=clone(raw["above"]))
        if "below" in raw:
            structured["below"] = clone(raw["below"]) if is_mapping(raw["below"]) else CommentedMap(color=clone(raw["below"]))
    else:
        structured["at"] = normalize_resolvable_input(raw)
    return structured


def append_if_present(target: CommentedMap, key: str, value: Any) -> None:
    if value:
        target[key] = value


def is_legacy_baseline(raw: Any) -> bool:
    if not is_mapping(raw):
        return True
    if "at" in raw:
        at = raw["at"]
        if not is_mapping(at):
            return True
        if "value" in at:
            return True
    if "above" in raw and not is_mapping(raw["above"]):
        return True
    if "below" in raw and not is_mapping(raw["below"]):
        return True
    return False


def is_legacy_entity_config(config: CommentedMap) -> bool:
    if any(key in config for key in FLAT_KEYS):
        return True
    if "target" in config and not is_mapping(config["target"]):
        return True
    if "baseline" in config and is_legacy_baseline(config["baseline"]):
        return True
    return False


def transform_entity_config(config: CommentedMap) -> CommentedMap:
    out = CommentedMap()
    for key in ("entity", "name", "icon"):
        if key in config:
            out[key] = clone(config[key])
    append_if_present(out, "layout", build_layout(config))
    append_if_present(out, "scale", build_scale(config))
    append_if_present(out, "formatting", build_formatting(config))
    append_if_present(out, "target", build_target(config))
    append_if_present(out, "peak", build_peak(config))
    baseline = build_baseline(config)
    if baseline:
        out["baseline"] = baseline
    append_if_present(out, "bar", build_bar(config))

    skip_keys = FLAT_KEYS | {"layout", "scale", "formatting", "target", "peak", "bar", "baseline"}
    for key, value in config.items():
        if key in out or key in skip_keys:
            continue
        out[key] = transform_node(value)
    return out


def transform_sbcp_card(card: CommentedMap) -> CommentedMap:
    out = CommentedMap()
    for key in ("type", "title", "entity", "name", "icon"):
        if key in card:
            out[key] = clone(card[key])
    if "entities" in card and is_sequence(card["entities"]):
        entities = CommentedSeq()
        for entity_config in card["entities"]:
            entities.append(transform_entity_config(entity_config) if is_mapping(entity_config) else clone(entity_config))
        out["entities"] = entities

    append_if_present(out, "layout", build_layout(card))
    append_if_present(out, "scale", build_scale(card))
    append_if_present(out, "formatting", build_formatting(card))
    append_if_present(out, "target", build_target(card))
    append_if_present(out, "peak", build_peak(card))
    baseline = build_baseline(card)
    if baseline:
        out["baseline"] = baseline
    append_if_present(out, "bar", build_bar(card))

    skip_keys = FLAT_KEYS | {"layout", "scale", "formatting", "target", "peak", "bar", "baseline"}
    for key, value in card.items():
        if key in out or key in skip_keys:
            continue
        out[key] = transform_node(value)
    return out


def transform_node(node: Any) -> Any:
    if is_mapping(node):
        if node.get("type") == SBCP_TYPE:
            return transform_sbcp_card(node)
        out = CommentedMap()
        for key, value in node.items():
            out[key] = transform_node(value)
        return out
    if is_sequence(node):
        out = CommentedSeq()
        for item in node:
            out.append(transform_node(item))
        return out
    return clone(node)


def collect_sbcp_stats(node: Any) -> tuple[int, int]:
    total = 0
    legacy = 0
    if is_mapping(node):
        if node.get("type") == SBCP_TYPE:
            total += 1
            if is_legacy_entity_config(node):
                legacy += 1
            elif "entities" in node and is_sequence(node["entities"]):
                if any(is_mapping(item) and is_legacy_entity_config(item) for item in node["entities"]):
                    legacy += 1
        for value in node.values():
            child_total, child_legacy = collect_sbcp_stats(value)
            total += child_total
            legacy += child_legacy
    elif is_sequence(node):
        for item in node:
            child_total, child_legacy = collect_sbcp_stats(item)
            total += child_total
            legacy += child_legacy
    return total, legacy


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Convert legacy Sensor Bar Card Plus YAML to structured config.")
    parser.add_argument("input", nargs="?", help="Input YAML file. Reads stdin when omitted.")
    parser.add_argument("output_path", nargs="?", help="Optional output YAML file. Writes stdout when omitted.")
    parser.add_argument("-o", "--output", help="Output YAML file. Writes stdout when omitted.")
    parser.add_argument("--check", action="store_true", help="Report how many SBCP cards are already structured vs migratable.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    output_path = args.output if args.output is not None else args.output_path
    data = read_yaml(args.input)
    total, legacy = collect_sbcp_stats(data)
    structured = total - legacy

    if args.check:
        print(f"Found {total} Sensor Bar Card Plus cards")
        print(f"{structured} already structured")
        print(f"{legacy} legacy cards can be migrated")
        return 0

    converted = transform_node(data)
    write_yaml(converted, output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
