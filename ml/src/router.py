"""
Settlement Route Optimizer — Q-table reinforcement learning.

State:  (from_currency, to_currency, amount_bucket, time_of_day_bucket)
Action: route index (direct_usdc | jupiter_swap | orca_swap | raydium_lp | bridge_wormhole)
Reward: -cost_usd (maximize savings vs SWIFT baseline of $847 per $250k)

On startup the model loads a pre-trained Q-table from disk (if available),
otherwise it initializes with random exploration and retrains on the first
batch of historical data pulled from the backend.

Production note: replace the Q-table with a neural network (DQN) once you
have 10,000+ real settlements to train on. Q-table is interpretable and
safe for the MVP — every routing decision can be explained.
"""

import os
import json
import random
import math
import numpy as np
import joblib
from dataclasses import dataclass, asdict
from typing import List, Optional

MODEL_PATH = os.getenv("MODEL_PATH", "./models/q_table.pkl")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.70"))

# Routes available on devnet — add more as liquidity grows
ROUTES = [
    {"id": "direct_usdc",     "name": "Direct USDC Transfer",        "base_cost_bps": 1,   "time_s": 2.8,  "reliability": 0.99},
    {"id": "jupiter_swap",    "name": "Jupiter Aggregator",           "base_cost_bps": 8,   "time_s": 3.5,  "reliability": 0.97},
    {"id": "orca_whirlpool",  "name": "Orca Whirlpool",              "base_cost_bps": 12,  "time_s": 4.0,  "reliability": 0.96},
    {"id": "raydium_clmm",   "name": "Raydium CLMM",                "base_cost_bps": 15,  "time_s": 4.2,  "reliability": 0.95},
    {"id": "wormhole_bridge", "name": "Wormhole Bridge (cross-chain)","base_cost_bps": 25,  "time_s": 15.0, "reliability": 0.92},
]

CURRENCIES = ["USDC", "BRZ", "MXNe", "PHPC", "VND_e", "INRe"]
AMOUNT_BUCKETS = [(0, 10_000), (10_000, 100_000), (100_000, 500_000), (500_000, float("inf"))]
HOURS = list(range(24))


@dataclass
class RouteRecommendation:
    id: str
    name: str
    cost_usd: float
    cost_bps: float
    time_seconds: float
    confidence: float
    savings_vs_swift: float
    hops: List[str]
    alternatives: List[dict]


class QLearningRouter:
    """
    Q-table with epsilon-greedy exploration.

    State space:  len(CURRENCIES)^2 * len(AMOUNT_BUCKETS) * 4  (time-of-day quartiles)
    Action space: len(ROUTES)
    """

    def __init__(self, alpha=0.1, gamma=0.9, epsilon=0.3):
        self.alpha = alpha       # learning rate
        self.gamma = gamma       # discount factor
        self.epsilon = epsilon   # exploration rate
        self.n_states = len(CURRENCIES) * len(CURRENCIES) * len(AMOUNT_BUCKETS) * 4
        self.n_actions = len(ROUTES)
        self.q_table = np.zeros((self.n_states, self.n_actions))
        self.episode_count = 0

    # ── State encoding ──────────────────────────────────────────────────────

    def _state_index(self, from_ccy: str, to_ccy: str, amount: float, hour: int) -> int:
        fi = CURRENCIES.index(from_ccy) if from_ccy in CURRENCIES else 0
        ti = CURRENCIES.index(to_ccy)   if to_ccy   in CURRENCIES else 0
        ai = self._amount_bucket(amount)
        qi = hour // 6   # 4 quartiles: night, morning, afternoon, evening
        return (fi * len(CURRENCIES) * len(AMOUNT_BUCKETS) * 4
                + ti * len(AMOUNT_BUCKETS) * 4
                + ai * 4
                + qi)

    def _amount_bucket(self, amount: float) -> int:
        for i, (lo, hi) in enumerate(AMOUNT_BUCKETS):
            if lo <= amount < hi:
                return i
        return len(AMOUNT_BUCKETS) - 1

    # ── Action selection ─────────────────────────────────────────────────────

    def select_action(self, state_idx: int, explore: bool = False) -> int:
        if explore and random.random() < self.epsilon:
            return random.randint(0, self.n_actions - 1)
        return int(np.argmax(self.q_table[state_idx]))

    # ── Learning update ───────────────────────────────────────────────────────

    def update(self, state_idx: int, action: int, reward: float, next_state_idx: int):
        current_q = self.q_table[state_idx, action]
        max_next_q = np.max(self.q_table[next_state_idx])
        self.q_table[state_idx, action] = current_q + self.alpha * (
            reward + self.gamma * max_next_q - current_q
        )
        self.episode_count += 1
        # Decay epsilon over time — exploit more as we learn
        self.epsilon = max(0.05, self.epsilon * 0.9995)

    # ── Reward function ───────────────────────────────────────────────────────

    def compute_reward(self, amount: float, actual_cost_usd: float, time_seconds: float) -> float:
        """
        Reward = savings vs SWIFT baseline, penalised by time.
        SWIFT baseline: ~$847 per $250k = 0.0033% + $35 fixed + FX spread ~0.8%.
        """
        swift_cost = amount * 0.0033 + 35 + amount * 0.008
        savings = swift_cost - actual_cost_usd
        time_penalty = max(0, time_seconds - 5) * 0.01   # small penalty above 5s
        return savings - time_penalty

    # ── Confidence score ─────────────────────────────────────────────────────

    def confidence(self, state_idx: int, action: int) -> float:
        """Softmax-derived confidence over Q-values for this state."""
        q_vals = self.q_table[state_idx]
        if q_vals.max() == q_vals.min():
            return 1.0 / self.n_actions
        exp_q = np.exp(q_vals - q_vals.max())
        softmax = exp_q / exp_q.sum()
        return float(softmax[action])

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self, path: str = MODEL_PATH):
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        joblib.dump({"q_table": self.q_table, "epsilon": self.epsilon,
                     "episodes": self.episode_count}, path)

    def load(self, path: str = MODEL_PATH) -> bool:
        if not os.path.exists(path):
            return False
        data = joblib.load(path)
        self.q_table = data["q_table"]
        self.epsilon = data.get("epsilon", 0.05)
        self.episode_count = data.get("episodes", 0)
        return True

    # ── Synthetic pre-training ────────────────────────────────────────────────

    def pretrain(self, episodes: int = 5000):
        """
        Bootstrap the Q-table with simulated settlements before any real data.
        Real costs are injected from the backend once settlements start flowing.
        """
        for _ in range(episodes):
            from_ccy = random.choice(CURRENCIES)
            to_ccy = random.choice([c for c in CURRENCIES if c != from_ccy])
            amount = random.uniform(1_000, 1_000_000)
            hour = random.randint(0, 23)
            state = self._state_index(from_ccy, to_ccy, amount, hour)

            action = self.select_action(state, explore=True)
            route = ROUTES[action]

            # Simulate cost with noise (±20%)
            cost_usd = amount * route["base_cost_bps"] / 10_000 * random.uniform(0.8, 1.2)
            # Failure probability
            if random.random() > route["reliability"]:
                reward = -amount * 0.005   # penalty for failed route
            else:
                reward = self.compute_reward(amount, cost_usd, route["time_s"])

            next_state = state   # stateless environment (each settlement is independent)
            self.update(state, action, reward, next_state)

        self.save()


# ── Singleton router loaded at module import ──────────────────────────────────

_router = QLearningRouter()
if not _router.load():
    _router.pretrain(episodes=8000)
    _router.save()


def predict(from_currency: str, to_currency: str, amount: float, hour: int = None) -> RouteRecommendation:
    """
    Return the best route and top alternatives for a settlement request.
    Called by the Flask API endpoint POST /predict.
    """
    import datetime
    if hour is None:
        hour = datetime.datetime.utcnow().hour

    # Normalise unknown currencies to USDC
    if from_currency not in CURRENCIES:
        from_currency = "USDC"
    if to_currency not in CURRENCIES:
        to_currency = "USDC"

    state = _router._state_index(from_currency, to_currency, amount, hour)
    action = _router.select_action(state, explore=False)
    confidence = _router.confidence(state, action)

    # If model isn't confident enough, fall back to cheapest known route
    if confidence < CONFIDENCE_THRESHOLD:
        action = 0   # direct_usdc — always the safest fallback

    route = ROUTES[action]
    cost_usd = amount * route["base_cost_bps"] / 10_000
    swift_cost = amount * 0.0033 + 35 + amount * 0.008

    # Build alternatives (sorted by cost)
    alts = []
    for i, r in enumerate(ROUTES):
        if i == action:
            continue
        alt_cost = amount * r["base_cost_bps"] / 10_000
        alts.append({
            "id": r["id"], "name": r["name"],
            "cost_usd": round(alt_cost, 4),
            "time_seconds": r["time_s"],
        })
    alts.sort(key=lambda x: x["cost_usd"])

    return RouteRecommendation(
        id=route["id"],
        name=route["name"],
        cost_usd=round(cost_usd, 4),
        cost_bps=route["base_cost_bps"],
        time_seconds=route["time_s"],
        confidence=round(confidence, 4),
        savings_vs_swift=round(swift_cost - cost_usd, 2),
        hops=[from_currency, route["id"], to_currency],
        alternatives=alts[:3],
    )


def record_outcome(from_currency: str, to_currency: str, amount: float,
                   route_id: str, actual_cost_usd: float, succeeded: bool):
    """
    Called after a settlement completes (or fails). Updates the Q-table with
    the real outcome so the model improves with every live transaction.
    """
    hour = __import__("datetime").datetime.utcnow().hour
    state = _router._state_index(from_currency, to_currency, amount, hour)
    action = next((i for i, r in enumerate(ROUTES) if r["id"] == route_id), 0)

    if succeeded:
        reward = _router.compute_reward(amount, actual_cost_usd, ROUTES[action]["time_s"])
    else:
        reward = -amount * 0.005

    _router.update(state, action, reward, state)

    # Persist every 100 updates
    if _router.episode_count % 100 == 0:
        _router.save()
