"""Persian voice -> nutrition log API.

Run:
  pip install -r requirements.txt
  uvicorn app.main:app --host 0.0.0.0 --port 8000

Layer 3 ASR uses GapGPT Whisper API (no local model download).
Set OPENAI_API_KEY + OPENAI_BASE_URL (see fitness_app/backend/.env).
"""

from __future__ import annotations

import asyncio
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .asr import NutritionASR
from .extract import extract
from .foods_db import FoodDB

MAX_CONCURRENT_DECODES = int(os.environ.get("MAX_CONCURRENT_DECODES", os.cpu_count() or 4))

asr: NutritionASR | None = None
db: FoodDB | None = None
decode_gate: asyncio.Semaphore | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global asr, db, decode_gate
    print("Loading food database and GapGPT ASR config...", flush=True)
    asr = NutritionASR()
    db = FoodDB()
    decode_gate = asyncio.Semaphore(MAX_CONCURRENT_DECODES)
    if asr.configured:
        print(
            f"Ready. {len(db.by_name)} foods loaded; ASR={asr.model} @ {asr.base_url}; "
            f"concurrency={MAX_CONCURRENT_DECODES}.",
            flush=True,
        )
    else:
        print(
            f"WARNING: OPENAI_API_KEY missing — ASR will fail. "
            f"{len(db.by_name)} foods loaded.",
            flush=True,
        )
    yield
    asr = None
    db = None


app = FastAPI(title="Persian Nutrition Voice Log", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "ok": True,
        "asr": "gapgpt",
        "asr_configured": asr is not None and asr.configured,
        "asr_model": asr.model if asr else None,
        "foods_loaded": len(db.by_name) if db else 0,
        # legacy field for older health checks
        "model_loaded": asr is not None and asr.configured,
    }


async def _read_upload(file: UploadFile) -> tuple[str, str, bytes]:
    if asr is None or decode_gate is None:
        raise HTTPException(503, "Service is still starting")
    filename = file.filename or "audio.ogg"
    suffix = Path(filename).suffix.lower() or ".ogg"
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 25 MB)")
    return filename, suffix, data


async def _transcribe_upload(filename: str, suffix: str, data: bytes) -> dict:
    assert asr is not None and decode_gate is not None
    if not asr.configured:
        raise HTTPException(503, "GapGPT ASR not configured (OPENAI_API_KEY missing)")
    async with decode_gate:
        try:
            return await asyncio.to_thread(
                asr.transcribe_bytes,
                data,
                suffix=suffix,
                filename=filename,
            )
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(400, f"Could not transcribe audio: {exc}") from exc


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(..., description="Audio file (ogg/mp3/wav/webm/m4a)")):
    """Layer 3 only — speech to corrected Persian text (all non-food voice flows)."""
    filename, suffix, data = await _read_upload(file)
    t0 = time.perf_counter()
    asr_result = await _transcribe_upload(filename, suffix, data)
    low = bool(asr_result["low_confidence"])
    return {
        "text": asr_result["text"],
        "low_confidence": low,
        "confidence": {
            "level": "low" if low else "high",
            "avg_logprob": asr_result.get("avg_logprob"),
            "compression_ratio": asr_result.get("compression_ratio"),
        },
        "elapsed_ms": round((time.perf_counter() - t0) * 1000),
    }


@app.post("/log-meal")
async def log_meal(file: UploadFile = File(..., description="Audio file (ogg/mp3/wav/webm/m4a)")):
    if db is None:
        raise HTTPException(503, "Food database not loaded")

    filename, suffix, data = await _read_upload(file)
    t0 = time.perf_counter()
    asr_result = await _transcribe_upload(filename, suffix, data)

    result = extract(asr_result["text"], db)
    low = bool(asr_result["low_confidence"])
    result["confidence"] = {
        "level": "low" if low else "high",
        "avg_logprob": asr_result.get("avg_logprob"),
        "compression_ratio": asr_result.get("compression_ratio"),
    }
    result["low_confidence"] = low
    result["elapsed_ms"] = round((time.perf_counter() - t0) * 1000)
    return result
