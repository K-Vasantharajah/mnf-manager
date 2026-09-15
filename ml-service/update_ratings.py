#!/usr/bin/env python3
"""
Batch job to recalculate and update player ratings in the database.
Run this after each match night to keep ratings fresh.

Usage:
    python update_ratings.py
    
On Azure this will be run as a scheduled Function App nightly.
"""

import logging
from sqlalchemy import create_engine, text
from models.ratings import calculate_derived_ratings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
log = logging.getLogger(__name__)

DB_URL = "postgresql://mnf:mnf_local_password@localhost:5432/mnfmanager"

def update_ratings():
    log.info("Starting ratings recalculation...")
    
    df = calculate_derived_ratings()
    log.info(f"Calculated ratings for {len(df)} players")

    engine = create_engine(DB_URL)

    with engine.begin() as conn:
        # Store previous ratings before clearing
        previous = pd.read_sql(
            text("SELECT player_id, attack_rating, defence_rating, overall_rating, reliability FROM player_ratings"),
            conn
        )
        prev_dict = previous.set_index('player_id').to_dict(orient='index')

        # Clear and reinsert
        conn.execute(text("DELETE FROM player_ratings"))

        for _, row in df.iterrows():
            pid = int(row['player_id'])
            new_attack = int(row['attack_rating'])
            new_defence = int(row['defence_rating'])
            new_overall = int(row['overall_rating'])
            new_reliability = int(row['reliability_rating'])

            prev = prev_dict.get(pid, {})
            attack_delta = new_attack - (prev.get('attack_rating') or new_attack)
            defence_delta = new_defence - (prev.get('defence_rating') or new_defence)
            overall_delta = new_overall - (prev.get('overall_rating') or new_overall)

            conn.execute(text("""
                INSERT INTO player_ratings (
                    player_id, attack_rating, defence_rating, overall_rating,
                    reliability, rated_by, rated_at,
                    attack_delta, defence_delta, overall_delta, reliability_delta
                )
                VALUES (
                    :pid, :attack, :defence, :overall,
                    :reliability, 'ML Model', NOW(),
                    :attack_delta, :defence_delta, :overall_delta, :reliability_delta
                )
            """), {
                "pid": pid,
                "attack": new_attack,
                "defence": new_defence,
                "overall": new_overall,
                "reliability": new_reliability,
                "attack_delta": attack_delta,
                "defence_delta": defence_delta,
                "overall_delta": overall_delta,
                "reliability_delta": new_reliability,
            })

    log.info(f"Inserted ML ratings for {len(df)} players")
    log.info("Ratings update complete")
    return len(df)

if __name__ == '__main__':
    update_ratings()