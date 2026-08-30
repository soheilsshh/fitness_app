"""Text-only smoke test for the deterministic extraction pipeline (no audio/ASR
needed) — run with: .venv\\Scripts\\python.exe test_extract.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402

CASES = [
    "صبحانه یک لیوان شیر و دو تا نان خوردم",
    "ناهار یک بشقاب چلو کباب کوبیده خوردم",
    "یک قاشق چایخوری عسل خوردم",
    "یک قاشق غذاخوری روغن ریختم",
    "یک کف دست گوشت خوردم",
    "دیشب یک کاسه ماست خوردم",
    "صد گرم برنج خوردم",
    "نان پنیر خوردم",
    "دیزی خوردم",
    "امروز یک سیب و یک موز خوردم",
    "یک عدد تخم مرغ آب پز خوردم",
    "میان وعده یک استکان چای با یک حبه قند خوردم",
]

db = FoodDB()
print(f"[loaded {len(db.by_name)} distinct foods]\n")

for text in CASES:
    result = extract(text, db)
    print(f"IN : {text}")
    print(f"meal={result['meal']}  total_kcal={result['total_kcal']}")
    for item in result["items"]:
        print(f"  - {item}")
    if result["unmatched"]:
        print(f"  ! unmatched: {result['unmatched']}")
    print()
