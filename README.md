# SoulScope Monorepo

This repository keeps the SoulScope UI and the FastAPI fusion engine in a single, organized tree.

## Project Layout

```
soulscope/
├── frontend/          # Next.js UI (app router)
├── backend/           # FastAPI + CoreScope engine
│   ├── main.py        # HTTP entrypoint
│   ├── requirements.txt
│   ├── corescope/     # Core Frequency domain logic
│   │   ├── audio/
│   │   ├── core_frequency/
│   │   └── physio/
│   └── tests/
├── README.md
└── .gitignore
```

### Backend

1. Install dependencies inside a virtual environment:
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Run the API:
   ```bash
   uvicorn main:app --reload
   ```
3. Call the `/core-frequency` endpoint with JSON payloads (see `backend/main.py` for the schema).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Point a `.env` or fetch call to the FastAPI host once it is live. The included `CoreFrequencyCard` component is a placeholder to help wire up data visualizations.
