from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api._titanic import predict_csv_bytes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, choices=["dt", "rf", "lr"])
    parser.add_argument("--filename", default="upload.csv")
    args = parser.parse_args()

    try:
        csv_bytes = sys.stdin.buffer.read()
        print(json.dumps(predict_csv_bytes(args.model, csv_bytes, args.filename), ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
