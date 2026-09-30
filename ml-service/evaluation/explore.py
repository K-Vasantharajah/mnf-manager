def challenger_appearances():
    """How often each player was on the challenging captain's team.

    Pick order isn't recorded, so this is the closest available proxy: the
    challenger is whichever captain didn't win the previous match.
    """
    from evaluation.dataset import load_matches, load_lineups, with_challenger

    matches = with_challenger(load_matches())
    lineups = load_lineups()
    known = matches[matches["challenger_team"].notna()]

    merged = lineups.merge(
        known[["match_id", "challenger_team"]], on="match_id", how="inner"
    )
    merged["on_challenger"] = merged["team"] == merged["challenger_team"]

    from data.loader import load_all_players

    names = load_all_players().set_index("id")["name"].to_dict()

    summary = (
        merged.groupby("player_id")
        .agg(
            matches=("match_id", "count"),
            on_challenger=("on_challenger", "sum"),
        )
        .reset_index()
    )
    summary["name"] = summary["player_id"].map(names)
    summary["pct"] = (summary["on_challenger"] / summary["matches"] * 100).round(1)
    return summary[summary["matches"] >= 10].sort_values("pct", ascending=False)


def captain_counts():
    """How often each player has captained, to separate captaincy from pick order."""
    from data.loader import get_engine
    import pandas as pd
    from sqlalchemy import text

    query = """
        SELECT p.name, COUNT(*) AS captained
        FROM matches m
        JOIN players p ON p.id = m.captain_a_id OR p.id = m.captain_b_id
        WHERE m.is_exhibition = false
        GROUP BY p.name
        ORDER BY captained DESC
    """
    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn)


if __name__ == "__main__":
    print(captain_counts().to_string())