"""
Export ratings from a seeded local demo database into the demo fixture.

Refuses any database not ending in _demo: exporting real players' ratings
into the repository would publish them.

    DATABASE_URL='postgresql://...localhost:5432/mnfmanager_demo' python demo/export_demo_ratings.py
"""

import json
import os
from pathlib import Path

from sqlalchemy import create_engine, text

OUTPUT = (
    Path(__file__).resolve().parents[2]
    / "backend/src/main/resources/demo/demo-ratings.json"
)

url = os.environ["DATABASE_URL"]
database = url.split("?")[0].rstrip("/").rsplit("/", 1)[-1]
if not database.endswith("_demo"):
    raise SystemExit(f"Refusing to export from '{database}': not a _demo database")

query = """
    SELECT p.name, r.attack_rating, r.defence_rating, r.overall_rating, r.reliability
    FROM player_ratings r
    JOIN players p ON p.id = r.player_id
    ORDER BY p.name
"""
with create_engine(url).connect() as conn:
    rows = conn.execute(text(query)).mappings().all()

ratings = [
    {
        "name": row["name"],
        "attackRating": row["attack_rating"],
        "defenceRating": row["defence_rating"],
        "overallRating": row["overall_rating"],
        "reliability": row["reliability"],
    }
    for row in rows
]
OUTPUT.write_text(json.dumps(ratings, indent=2))
print(f"Wrote {len(ratings)} ratings to {OUTPUT}")
