# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow your React dev server to talk to this API
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CoreFrequencyResponse(BaseModel):
    core_index: float
    body_resonance: float
    soul_resonance: float
    heart_mind_resonance: float
    qualitative_label: str


@app.get("/api/core-frequency/mock", response_model=CoreFrequencyResponse)
def get_mock_core_frequency():
    # For now just return fake data that matches what the UI expects
    return CoreFrequencyResponse(
        core_index=0.63,
        body_resonance=0.58,
        soul_resonance=0.71,
        heart_mind_resonance=0.54,
        qualitative_label="Adaptive but Strained",
    )
