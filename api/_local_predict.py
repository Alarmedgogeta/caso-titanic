from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from api._titanic import predict_row


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, choices=["dt", "rf", "lr"])
    args = parser.parse_args()

    try:
        payload = json.loads(sys.stdin.read() or "{}")
        print(json.dumps(predict_row(args.model, payload), ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
