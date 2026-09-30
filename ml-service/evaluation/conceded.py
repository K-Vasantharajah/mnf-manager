from data.loader import get_engine
import pandas as pd
from sqlalchemy import text

query = """
SELECT
    p.name,
    p.position,
    COUNT(*) AS apps,
    SUM(CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END) AS conceded,
    ROUND(SUM(CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END)::numeric
          / COUNT(*), 2) AS conceded_pg,
    ROUND(SUM(CASE WHEN mp.team = 'A' THEN m.score_a ELSE m.score_b END)::numeric
          / COUNT(*), 2) AS scored_pg,
    COUNT(*) FILTER (
        WHERE (CASE WHEN mp.team = 'A' THEN m.score_b ELSE m.score_a END) = 0
    ) AS clean_sheets
FROM match_players mp
JOIN players p ON p.id = mp.player_id
JOIN matches m ON m.id = mp.match_id
WHERE m.is_exhibition = false
GROUP BY p.name, p.position
HAVING COUNT(*) >= 10
ORDER BY conceded_pg
"""

with get_engine().connect() as conn:
    print(pd.read_sql(text(query), conn).to_string())
