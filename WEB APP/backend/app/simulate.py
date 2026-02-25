"""
Simulazione 30 giorni — genera dati realistici per demo e analisi.

Simula un utente ansioso che usa l'app con costanza variabile.
Produce eventi, ricalcola crescita e stato del mare giorno per giorno.

Run:
    python -m app.simulate
"""
import random
from datetime import datetime, timedelta, timezone

from app.db.database import SessionLocal, init_db
from app.models.models import Event, Fish, FishState, SeaState, User
from app.services.growth import compute_fish_growth
from app.services.sea_state import compute_sea_state


def simulate():
    init_db()
    db = SessionLocal()

    # ── Create user ──
    user = User(locale="it", onboarding_completed=True)
    db.add(user)
    db.flush()
    print(f"👤 User created: {user.id}")

    # ── Create fish ──
    dimensions = ["studio", "lavoro", "benessere"]
    fish_map = {}
    for dim in dimensions:
        f = Fish(user_id=user.id, dimension=dim)
        db.add(f)
        db.flush()
        db.add(FishState(fish_id=f.id))
        fish_map[dim] = f.id

    # ── Init sea state ──
    db.add(SeaState(
        user_id=user.id,
        visual_params={"light": 0.4, "wave_speed": 0.5, "particles": False},
    ))
    db.commit()

    # ── Simulate 30 days ──
    start_date = datetime.now(timezone.utc) - timedelta(days=30)

    print("\n📅 Simulazione 30 giorni\n")
    print(f"{'Giorno':>6} | {'Ansia':>5} | {'Energia':>7} | {'Eventi':>6} | {'Crescita media':>14} | {'Mare':>12}")
    print("-" * 70)

    for day in range(30):
        current_date = start_date + timedelta(days=day)

        # Probability of being active (increases over time with some variance)
        base_prob = 0.5 + day * 0.01
        active_today = random.random() < min(base_prob, 0.85)

        if not active_today:
            # Recompute with no new events
            compute_fish_growth(db, user.id, current_date)
            compute_sea_state(db, user.id, current_date)
            sea = db.get(SeaState, user.id)
            print(f"  {day+1:>4}  | {'—':>5} | {'—':>7} | {'0':>6} | {'—':>14} | {sea.sea_state_label:>12}")
            continue

        # Anxiety pattern: starts high, gradually improves with noise
        base_anxiety = max(1, 5 - day * 0.08 + random.gauss(0, 0.8))
        anxiety = max(1, min(5, round(base_anxiety)))

        energy = random.choice([1, 2, 2, 3])
        context = random.choice(["studio", "lavoro", "studio", "studio"])
        events_today = 0

        # Check-in
        db.add(Event(
            user_id=user.id,
            event_type="check_in",
            metadata_json={
                "anxiety_level": anxiety,
                "energy": energy,
                "context": context,
                "fish_id": fish_map[context],
            },
            created_at=current_date,
        ))
        events_today += 1

        # Maybe micro-action (more likely if anxiety is high)
        if random.random() < (0.3 + anxiety * 0.1):
            db.add(Event(
                user_id=user.id,
                event_type="micro_action",
                metadata_json={
                    "action_type": random.choice(["breathing", "grounding", "journaling"]),
                    "fish_id": fish_map[random.choice(dimensions)],
                },
                created_at=current_date + timedelta(minutes=5),
            ))
            events_today += 1

        # Maybe reflection
        if random.random() < 0.25:
            db.add(Event(
                user_id=user.id,
                event_type="reflection",
                metadata_json={
                    "fish_id": fish_map["benessere"],
                },
                created_at=current_date + timedelta(minutes=10),
            ))
            events_today += 1

        db.commit()

        # Recompute
        compute_fish_growth(db, user.id, current_date)
        compute_sea_state(db, user.id, current_date)

        # Report
        fish_states = [db.get(FishState, fid) for fid in fish_map.values()]
        avg_growth = sum(fs.growth_level for fs in fish_states if fs) / len(fish_states)
        sea = db.get(SeaState, user.id)

        print(
            f"  {day+1:>4}  | {anxiety:>5} | {energy:>7} | "
            f"{events_today:>6} | {avg_growth:>13.3f} | {sea.sea_state_label:>12}"
        )

    # ── Final report ──
    print("\n" + "=" * 70)
    print("📊 REPORT FINALE\n")

    sea = db.get(SeaState, user.id)
    print(f"  Stato del mare: {sea.sea_state_label} (score: {sea.sea_state_score:.3f})")
    print(f"  Visual params: {sea.visual_params}\n")

    for dim, fid in fish_map.items():
        fs = db.get(FishState, fid)
        print(f"  🐟 {dim}: growth={fs.growth_level:.3f}, stage={fs.visual_stage}")

    total_events = db.query(Event).filter(Event.user_id == user.id).count()
    print(f"\n  Totale eventi: {total_events}")
    print(f"  User ID: {user.id}")

    db.close()
    print("\n✅ Simulazione completata!")


if __name__ == "__main__":
    simulate()
