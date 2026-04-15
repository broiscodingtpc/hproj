"""Unit tests for the Q-learning route optimizer."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../src"))

from router import QLearningRouter, predict, ROUTES, CURRENCIES

def test_pretrain_runs():
    r = QLearningRouter()
    r.pretrain(episodes=200)
    assert r.episode_count == 200
    assert r.q_table.shape == (r.n_states, r.n_actions)

def test_predict_returns_recommendation():
    rec = predict("USDC", "BRZ", 250_000)
    assert rec.id in [r["id"] for r in ROUTES]
    assert 0 < rec.cost_usd < 250_000
    assert 0 <= rec.confidence <= 1
    assert rec.savings_vs_swift > 0   # always cheaper than SWIFT

def test_predict_unknown_currency_falls_back():
    rec = predict("XYZ", "ABC", 10_000)
    assert rec.id is not None   # should not crash

def test_small_amount_cheaper_than_large():
    small = predict("USDC", "BRZ", 1_000)
    large = predict("USDC", "BRZ", 1_000_000)
    assert small.cost_usd < large.cost_usd

def test_alternatives_are_sorted_by_cost():
    rec = predict("USDC", "MXNe", 50_000)
    costs = [a["cost_usd"] for a in rec.alternatives]
    assert costs == sorted(costs)

def test_savings_vs_swift_positive_for_all_routes():
    for ccy in CURRENCIES:
        rec = predict("USDC", ccy, 100_000)
        assert rec.savings_vs_swift > 0, f"Route {rec.id} costs more than SWIFT for {ccy}"

def test_q_table_updates_on_outcome():
    from router import record_outcome, _router
    before = _router.episode_count
    record_outcome("USDC", "BRZ", 100_000, "direct_usdc", 10.0, True)
    assert _router.episode_count == before + 1

if __name__ == "__main__":
    tests = [f for f in dir() if f.startswith("test_")]
    for t in tests:
        try:
            globals()[t]()
            print(f"  ✓ {t}")
        except Exception as e:
            print(f"  ✗ {t}: {e}")
