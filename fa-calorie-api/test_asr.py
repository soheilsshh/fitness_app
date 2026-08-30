import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.asr import NutritionASR  # noqa: E402
from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402

audio_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"E:\wisper\voice.ogg")

asr = NutritionASR()
if not asr.configured:
    print("OPENAI_API_KEY not set", file=sys.stderr)
    raise SystemExit(1)

t0 = time.perf_counter()
asr_result = asr.transcribe_bytes(
    audio_path.read_bytes(),
    suffix=audio_path.suffix or ".ogg",
    filename=audio_path.name,
)
text = asr_result["text"]
elapsed = time.perf_counter() - t0
print(f"transcribe wall time: {elapsed:.1f}s")
print(f"TEXT: {text}")

db = FoodDB()
result = extract(text, db)
print(f"meal={result['meal']} total_kcal={result['total_kcal']}")
for item in result["items"]:
    print(f"  - {item}")
if result["unmatched"]:
    print(f"  ! unmatched: {result['unmatched']}")
