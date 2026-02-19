# PW RIFT — Graph Forensics Prototype

A full-stack financial crime detection prototype powered by **NetworkX graph algorithms** and a **Next.js** interactive dashboard.

## Architecture

```
/backend    → Python / FastAPI / NetworkX / Pandas
/frontend   → Next.js 14 / Tailwind CSS / react-force-graph-2d
```

## Features

- **Bounded Cycle Detection** — Finds transaction cycles of length 3–5 (money laundering rings)
- **Temporal Smurfing** — Detects fan-out / fan-in structuring patterns with false-positive checks
- **Shell Pass-throughs** — Identifies shell accounts used as intermediaries
- **Composite Scoring** — Multi-pattern risk scoring with velocity bonus and multiplier
- **Interactive Graph Visualization** — Force-directed network topology with red-flagged nodes
- **JSON Report Export** — One-click download of the full analysis payload

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### CSV Format

Upload a CSV with these exact columns:

| Column | Description |
|---|---|
| `transaction_id` | Unique ID for the transaction |
| `sender_id` | Account ID of the sender |
| `receiver_id` | Account ID of the receiver |
| `amount` | Transaction amount |
| `timestamp` | ISO timestamp of the transaction |

## API Reference

### `POST /analyze`

Upload a CSV file and receive a full forensics report.

**Request:** `multipart/form-data` with a `file` field containing the CSV.

**Response:**
```json
{
  "suspicious_accounts": [...],
  "fraud_rings": [...],
  "summary": {
    "total_accounts_analyzed": 500,
    "suspicious_accounts_flagged": 12,
    "fraud_rings_detected": 3,
    "processing_time_seconds": 1.2
  }
}
```

## Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| Graph Engine | NetworkX + Pandas |
| Frontend | Next.js 14, React 18 |
| Styling | Tailwind CSS 3 |
| Visualization | react-force-graph-2d |
| Icons | lucide-react |
