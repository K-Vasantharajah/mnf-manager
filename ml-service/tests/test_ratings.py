import pytest
from sqlalchemy.exc import OperationalError

from evaluation.dataset import load_matches
from models import ratings as R


@pytest.fixture(scope="module")
def all_match_ids():
    try:
        ids = frozenset(load_matches()["match_id"])
    except OperationalError:
        pytest.skip("no database available")
    if not ids:
        pytest.skip("database has no matches")
    return ids


def test_subset_fit_on_all_matches_matches_production(all_match_ids):
    production = R.calculate_derived_ratings(force_refresh=True)
    subset = R.calculate_derived_ratings(match_ids=all_match_ids)
    assert production.equals(subset)


def test_subset_fit_does_not_touch_cache(all_match_ids):
    production = R.calculate_derived_ratings(force_refresh=True)
    earlier = frozenset(sorted(all_match_ids)[: len(all_match_ids) // 2])
    R.calculate_derived_ratings(match_ids=earlier)
    assert R.calculate_derived_ratings() is production
