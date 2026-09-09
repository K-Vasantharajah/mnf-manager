# MNF Manager — ML Service

Python microservice for derived player ratings and match predictions.

## Setup

Requires Python 3.11.

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running

```bash
source venv/bin/activate
python app.py
```

Service runs on `http://localhost:5000`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/ratings/` | Derived ratings for all players |
| GET | `/api/ratings/player/{id}` | Derived rating for specific player |

## How ratings are calculated

**Goal threat** — goals per game normalised against squad average using z-score, scaled 1-10.

**Reliability** — matches attended / total matches in dataset, scaled 1-10.

**Ability** — composite of points percentage (70%) and goals per game (30%), scaled 1-10.

All ratings use MinMaxScaler to ensure scores fall between 1 and 10.