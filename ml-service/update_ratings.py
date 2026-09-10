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
        # Clear all existing ratings
        conn.execute(text("DELETE FROM player_ratings"))
        log.info("Cleared existing ratings")

        for _, row in df.iterrows():
            conn.execute(text("""
                INSERT INTO player_ratings (
                    player_id, 
                    attack_rating, 
                    defence_rating, 
                    overall_rating,
                    reliability,
                    rated_by, 
                    rated_at
                )
                VALUES (
                    :pid, 
                    :attack_rating, 
                    :defence_rating, 
                    :overall_rating,
                    :reliability,
                    'ML Model', 
                    NOW()
                )
            """), {
                "pid": int(row['player_id']),
                "attack_rating": int(row['attack_rating']),
                "defence_rating": int(row['defence_rating']),
                "overall_rating": int(row['overall_rating']),
                "reliability": int(row['reliability_rating']),
            })

    log.info(f"Inserted ML ratings for {len(df)} players")
    log.info("Ratings update complete")
    return len(df)

if __name__ == '__main__':
    update_ratings()