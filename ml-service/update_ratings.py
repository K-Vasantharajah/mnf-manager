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

    updated = 0
    skipped = 0

    with engine.begin() as conn:
        for _, row in df.iterrows():
            # Check if rating record exists
            existing = conn.execute(
                text("SELECT player_id FROM player_ratings WHERE player_id = :pid"),
                {"pid": int(row['player_id'])}
            ).fetchone()

            if existing:
                conn.execute(text("""
                    UPDATE player_ratings
                    SET ability = :ability,
                        reliability = :reliability,
                        goal_threat = :goal_threat,
                        rated_by = 'ML Model',
                        rated_at = NOW()
                    WHERE player_id = :pid
                """), {
                    "ability": round(row['ability']),
                    "reliability": round(row['reliability']),
                    "goal_threat": round(row['goal_threat']),
                    "pid": int(row['player_id'])
                })
                updated += 1
            else:
                conn.execute(text("""
                    INSERT INTO player_ratings (player_id, ability, reliability, goal_threat, rated_by, rated_at)
                    VALUES (:pid, :ability, :reliability, :goal_threat, 'ML Model', NOW())
                """), {
                    "pid": int(row['player_id']),
                    "ability": round(row['ability']),
                    "reliability": round(row['reliability']),
                    "goal_threat": round(row['goal_threat'])
                })
                updated += 1

        log.info(f"Updated {updated} player ratings, skipped {skipped}")

    log.info("Ratings update complete")
    return updated

if __name__ == '__main__':
    update_ratings()