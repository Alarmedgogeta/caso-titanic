from __future__ import annotations

import io
import json
from email import policy
from email.parser import BytesParser
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


MODEL_CONFIG = {
    "dt": {
        "file": "modelo_DT_titanic.pkl",
        "id": "dt",
        "name": "Arbol de Decision",
        "displayName": "Árbol de Decisión",
        "accuracy": "75.21%",
    },
    "rf": {
        "file": "modelo_RF_titanic.pkl",
        "id": "rf",
        "name": "Random Forest",
        "displayName": "Random Forest",
        "accuracy": "76.07%",
    },
    "lr": {
        "file": "modelo_LR_titanic.pkl",
        "id": "lr",
        "name": "Regresion Logistica",
        "displayName": "Regresión Logística",
        "accuracy": "73.50%",
    },
}

FEATURE_COLUMNS = [
    "Pclass",
    "Sex",
    "Age",
    "SibSp",
    "Parch",
    "Fare",
    "Embarked",
    "FamilySize",
    "IsAlone",
    "Title",
]

TITLE_MEDIAN_AGE = {
    "Master": 3.5,
    "Miss": 21.0,
    "Mr": 30.0,
    "Mrs": 35.0,
    "Rare": 48.5,
}

def get_model_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parent / "model",
        Path.cwd() / "api" / "model",
        Path.cwd() / "public" / "model",
    ]

    for candidate in candidates:
        if (candidate / "modelo_RF_titanic.pkl").exists():
            return candidate

    return candidates[0]


MODEL_DIR = get_model_dir()


@lru_cache(maxsize=None)
def load_model(model_id: str):
    config = MODEL_CONFIG[model_id]
    return joblib.load(MODEL_DIR / config["file"])


@lru_cache(maxsize=1)
def load_title_encoder():
    return joblib.load(MODEL_DIR / "label_encoder_title_titanic.pkl")


def json_response(handler, payload: dict[str, Any], status: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def handle_options(handler) -> None:
    handler.send_response(204)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()


def read_json_body(handler) -> dict[str, Any]:
    content_length = int(handler.headers.get("content-length", "0") or "0")
    if content_length <= 0:
        raise ValueError("Body JSON requerido.")

    raw_body = handler.rfile.read(content_length)
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Body JSON inválido.") from exc

    if not isinstance(payload, dict):
        raise ValueError("El body debe ser un objeto JSON.")

    return payload


def read_csv_upload(handler) -> tuple[bytes, str]:
    content_type = handler.headers.get("content-type", "")
    content_length = int(handler.headers.get("content-length", "0") or "0")

    if content_length <= 0:
        raise ValueError("Archivo CSV requerido.")

    raw_body = handler.rfile.read(content_length)

    if content_type.startswith("text/csv") or content_type.startswith("application/csv"):
        return raw_body, "upload.csv"

    if "multipart/form-data" not in content_type:
        raise ValueError("Envía el CSV como multipart/form-data con campo 'file'.")

    message = BytesParser(policy=policy.default).parsebytes(
        (
            f"Content-Type: {content_type}\r\n"
            "MIME-Version: 1.0\r\n\r\n"
        ).encode("utf-8")
        + raw_body
    )

    for part in message.iter_parts():
        if part.get_param("name", header="content-disposition") == "file":
            filename = part.get_filename() or "upload.csv"
            payload = part.get_payload(decode=True)
            if not payload:
                raise ValueError("El archivo CSV está vacío.")
            return payload, filename

    raise ValueError("No se encontró el campo de archivo 'file'.")


def infer_title(row: dict[str, Any]) -> str:
    raw_title = row.get("Title")
    if isinstance(raw_title, str) and raw_title.strip():
        title = raw_title.strip()
    else:
        name = str(row.get("Name", ""))
        extracted = pd.Series([name]).str.extract(r" ([A-Za-z]+)\.", expand=False).iloc[0]
        title = extracted if isinstance(extracted, str) and extracted else ""

    rare_titles = {
        "Lady",
        "Countess",
        "Capt",
        "Col",
        "Don",
        "Dr",
        "Major",
        "Rev",
        "Sir",
        "Jonkheer",
        "Dona",
    }
    title = {"Mlle": "Miss", "Ms": "Miss", "Mme": "Mrs"}.get(title, title)
    if title in rare_titles:
        return "Rare"
    if title in {"Master", "Miss", "Mr", "Mrs", "Rare"}:
        return title

    sex = normalize_sex(row.get("Sex"))
    age = optional_float(row.get("Age"))
    if sex == "female":
        return "Miss" if age is not None and age < 18 else "Mrs"
    return "Master" if age is not None and age < 15 else "Mr"


def optional_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    parsed = pd.to_numeric(pd.Series([value]), errors="coerce").iloc[0]
    if pd.isna(parsed):
        return None
    return float(parsed)


def required_float(row: dict[str, Any], key: str, default: float | None = None) -> float:
    value = optional_float(row.get(key))
    if value is None:
        if default is None:
            raise ValueError(f"Campo requerido inválido o ausente: {key}")
        return default
    return value


def normalize_sex(value: Any) -> str:
    text = str(value).strip().lower()
    if text in {"1", "female", "f", "mujer"}:
        return "female"
    if text in {"0", "male", "m", "hombre"}:
        return "male"
    raise ValueError("Sex debe ser 'male'/'female' o 0/1.")


def normalize_embarked(value: Any) -> str:
    if value is None or value == "":
        return "S"
    text = str(value).strip().upper()
    if text in {"0", "S", "SOUTHAMPTON"}:
        return "S"
    if text in {"1", "C", "CHERBOURG"}:
        return "C"
    if text in {"2", "Q", "QUEENSTOWN"}:
        return "Q"
    raise ValueError("Embarked debe ser S, C o Q.")


def make_features(row: dict[str, Any]) -> tuple[pd.DataFrame, dict[str, Any]]:
    title = infer_title(row)
    age = required_float(row, "Age", TITLE_MEDIAN_AGE.get(title, 30.0))
    sex = normalize_sex(row.get("Sex"))
    embarked = normalize_embarked(row.get("Embarked"))
    sibsp = int(required_float(row, "SibSp", 0))
    parch = int(required_float(row, "Parch", 0))
    family_size = sibsp + parch + 1
    is_alone = 1 if family_size == 1 else 0

    sex_num = 1 if sex == "female" else 0
    embarked_num = {"S": 0, "C": 1, "Q": 2}[embarked]
    title_num = int(load_title_encoder().transform([title])[0])

    normalized = {
        "Pclass": int(required_float(row, "Pclass")),
        "Sex": sex,
        "Age": age,
        "SibSp": sibsp,
        "Parch": parch,
        "Fare": required_float(row, "Fare", 32.2),
        "Embarked": embarked,
        "FamilySize": family_size,
        "IsAlone": bool(is_alone),
        "Title": title,
    }

    features = pd.DataFrame(
        [
            {
                "Pclass": normalized["Pclass"],
                "Sex": sex_num,
                "Age": normalized["Age"],
                "SibSp": normalized["SibSp"],
                "Parch": normalized["Parch"],
                "Fare": normalized["Fare"],
                "Embarked": embarked_num,
                "FamilySize": family_size,
                "IsAlone": is_alone,
                "Title": title_num,
            }
        ],
        columns=FEATURE_COLUMNS,
    )

    return features, normalized


def predict_row(model_id: str, row: dict[str, Any]) -> dict[str, Any]:
    model = load_model(model_id)
    features, normalized = make_features(row)
    prediction = int(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]
    probability_died = float(probabilities[0])
    probability_survived = float(probabilities[1])
    confidence = probability_survived if prediction == 1 else probability_died

    return {
        "model": MODEL_CONFIG[model_id],
        "prediction": prediction,
        "label": "Sobrevivió" if prediction == 1 else "No sobrevivió",
        "probabilitySurvived": probability_survived,
        "probabilityDied": probability_died,
        "confidence": float(confidence),
        "features": normalized,
    }


def predict_single_request(handler, model_id: str) -> None:
    try:
        payload = read_json_body(handler)
        json_response(handler, predict_row(model_id, payload))
    except Exception as exc:
        json_response(handler, {"error": str(exc)}, 400)


def predict_csv_request(handler, model_id: str) -> None:
    try:
        csv_bytes, filename = read_csv_upload(handler)
        json_response(handler, predict_csv_bytes(model_id, csv_bytes, filename))
    except Exception as exc:
        json_response(handler, {"error": str(exc)}, 400)


def predict_csv_bytes(model_id: str, csv_bytes: bytes, filename: str = "upload.csv") -> dict[str, Any]:
    df = pd.read_csv(io.BytesIO(csv_bytes))
    if len(df) == 0:
        raise ValueError("El CSV no contiene filas.")
    if len(df) > 500:
        raise ValueError("Máximo 500 filas por archivo para mantener la función rápida.")

    results = []
    errors = []
    for index, row in df.iterrows():
        row_payload = row.where(pd.notna(row), None).to_dict()
        try:
            result = predict_row(model_id, row_payload)
            result["row"] = int(index) + 1
            results.append(result)
        except Exception as exc:
            errors.append({"row": int(index) + 1, "error": str(exc)})

    survived = sum(1 for item in results if item["prediction"] == 1)
    return {
        "model": MODEL_CONFIG[model_id],
        "filename": filename,
        "totalRows": int(len(df)),
        "successfulRows": len(results),
        "failedRows": len(errors),
        "summary": {
            "survived": survived,
            "notSurvived": len(results) - survived,
            "averageSurvivalProbability": (
                sum(item["probabilitySurvived"] for item in results) / len(results) if results else 0
            ),
        },
        "results": results,
        "errors": errors,
    }
