"""
Treasury Agent ML Service — Flask API.

Endpoints:
  POST /predict           → route recommendation
  POST /outcome           → record real settlement outcome (online learning)
  GET  /model/stats       → Q-table stats, episode count, epsilon
  POST /model/retrain     → trigger full retrain from DB history (async)
  GET  /health            → liveness check
"""

import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from router import predict, record_outcome, _router, ROUTES

load_dotenv()

app = Flask(__name__)


@app.post("/predict")
def predict_route():
    body = request.get_json(silent=True) or {}
    from_ccy = body.get("from", "USDC")
    to_ccy   = body.get("to",   "USDC")
    amount   = float(body.get("amount", 0))
    hour     = body.get("hour")   # optional — defaults to UTC now

    if amount <= 0:
        return jsonify({"error": "amount must be positive"}), 400

    rec = predict(from_ccy, to_ccy, amount, hour)

    return jsonify({
        "id":                rec.id,
        "name":              rec.name,
        "cost_usd":          rec.cost_usd,
        "cost_bps":          rec.cost_bps,
        "time_seconds":      rec.time_seconds,
        "confidence":        rec.confidence,
        "savings_vs_swift":  rec.savings_vs_swift,
        "hops":              rec.hops,
        "alternatives":      rec.alternatives,
    })


@app.post("/outcome")
def record_settlement_outcome():
    """Called by the backend after each settlement completes. Online learning."""
    body = request.get_json(silent=True) or {}
    try:
        record_outcome(
            from_currency=body["from"],
            to_currency=body["to"],
            amount=float(body["amount"]),
            route_id=body["route_id"],
            actual_cost_usd=float(body["actual_cost_usd"]),
            succeeded=bool(body.get("succeeded", True)),
        )
        return jsonify({"ok": True, "episodes": _router.episode_count})
    except KeyError as e:
        return jsonify({"error": f"missing field: {e}"}), 400


@app.get("/model/stats")
def model_stats():
    return jsonify({
        "episodes":     _router.episode_count,
        "epsilon":      round(_router.epsilon, 4),
        "routes":       [r["id"] for r in ROUTES],
        "q_table_shape": list(_router.q_table.shape),
        "q_table_nonzero": int(((_router.q_table != 0).sum())),
    })


@app.post("/model/retrain")
def retrain():
    """
    Full retrain from historical data. In production this reads from PostgreSQL,
    replays all past settlements, and resets the Q-table. MVP just runs pre-train.
    """
    _router.pretrain(episodes=10_000)
    return jsonify({"ok": True, "episodes": _router.episode_count})


@app.get("/health")
def health():
    return jsonify({"status": "healthy", "service": "treasury-agent-ml"})


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("ENV") == "development")
