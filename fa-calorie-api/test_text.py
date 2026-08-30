"""Regression: spelling repair on the 15-clip Whisper outputs.

No pytest on purpose — run with: python test_text.py
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402
from app.text import correct_asr_text, tokenize  # noqa: E402
from app.units import find_unit  # noqa: E402

# Actual Whisper output from the 15-clip run (file numbers were shuffled; labels
# here are the script test ids, not the .ogg filenames).
ASR = {
    1: "تست یک، امروز برای ناهار یک بشقاب برنج با خورش قیمه خوردن، بوده ده قاشق برهنج و یک تکه گوش داخل خورجت بود.",
    2: "تسته دو. صبحونه داد و تخم مرغ خوردم با یک تیکه نوسنگرگ و یک لیون چای قند هم نخوردم.",
    3: "برای شان صد و پنجاه گرم، سینه ای موقع گلیل شده خوردم، با حدود دویست گرهام، سیب زمینی آبپز و کمی سالاد.",
    5: "امروز ظهر فکر کنم یه دون پیتزا خوردم از اون پتزهای معمولی نصف شخوردم با یه لیوان میشبه",
    6: "پست شیش بعد از تمرین موز خوردم گیا اسکوپورت این وی با شیر کمچرب هم مصرف کردم.",
    7: "تسته هفت برای ناهار خوراک لوبیا خوردم، بوده یک کاسه متوسط لوبيا با دو کف دست نون بروری خوردم.",
    8: "تست هشت، صبح، دو تا خرما با چای خوردم، برای ناهار برنج و مرغ داشتر، عذر هم یه سیب و چند تا بادم خوردم",
    9: "امروز سیصد گرم ما کارانی، باوده صد گرفت گوشه چرخ کرده خوردم، و کنارش یه کاسته ماسته، کمچرخوردم.",
    10: "بعد از باشگاه یک وعده پروتینی خوردم شامل دویست گرم مرغ، صدگرم برنج و سالاد بدون سست",
    11: "شبی گازده، شبیگه همبرگر با پنیر، سیب زمینی سرخ کرده متوسط، و یه لیوان نوشابه رژیم میخورده",
    13: "به سه سیزده من امروز یه پرسوش کاف خوردم با برنج،البته برهنجشش رو کامل نخوردم شاید نصفشون خوردم؟",
    14: "رس چهارده صبحانه سه تا سفیده تخم مرغ و یه زرده خوردم. بعد تمرین هم کرا تیم پنج گرم مصرف کردم.",
    15: "ترس پونزد امروز صبحونه دو تا تخم مرغ و نون خوردم میان بعده یه موز ناهار خورش قورمه سبزی با برنج داشم، اصل قهبه خوردم و شب هم سوپ.",
}


class CorrectAsrTextTests(unittest.TestCase):
    def test_test1_rice_meat_gheymeh(self):
        text = correct_asr_text(ASR[1])
        self.assertNotIn("تست", text)
        self.assertIn("برنج", text)
        self.assertNotIn("برهنج", text)
        self.assertIn("تکه گوشت", text)
        self.assertNotIn("گوشتت", text)
        self.assertIn("خورشت", text)
        tokens = tokenize(ASR[1])
        self.assertIn("ده", tokens)
        self.assertIn("قاشق", tokens)

    def test_leadin_test_twenty_and_shomareh_stripped(self):
        twenty = correct_asr_text("تست بیست نان خوردم")
        self.assertNotIn("تست", twenty)
        self.assertIn("نان", twenty)
        numbered = correct_asr_text("شماره تست یک برنج خوردم")
        self.assertNotIn("شماره", numbered)
        self.assertNotIn("تست", numbered)
        self.assertIn("برنج", numbered)

    def test_test2_two_eggs_sangak_glass(self):
        tokens = tokenize(ASR[2])
        self.assertEqual(tokens[:4], ["صبحونه", "دو", "تا", "تخم"])
        self.assertIn("نان", tokens)
        self.assertIn("سنگک", tokens)
        self.assertIn("لیوان", tokens)
        self.assertNotIn("داد", tokens)

    def test_test3_grams_chicken_grill(self):
        tokens = tokenize(ASR[3])
        self.assertIn("شام", tokens)
        self.assertIn("صد", tokens)
        self.assertIn("پنجاه", tokens)
        self.assertIn("مرغ", tokens)
        self.assertIn("گریل", tokens)
        self.assertIn("دویست", tokens)
        self.assertEqual(tokens.count("گرم"), 2)
        self.assertNotIn("گرهام", tokens)

    def test_test5_half_pizza_soda(self):
        tokens = tokenize(ASR[5])
        self.assertIn("پیتزا", tokens)
        self.assertIn("پیتزاهای", tokens)
        self.assertIn("نوشابه", tokens)
        self.assertIn("نصفش", tokens)
        self.assertNotIn("میشبه", tokens)

    def test_test6_banana_whey(self):
        text = correct_asr_text(ASR[6])
        self.assertIn("اسکوپ پروتئین وی", text)
        self.assertIn("شیر کم چرب", text)
        self.assertNotIn("پست", text)

    def test_test7_beans_barbari(self):
        tokens = tokenize(ASR[7])
        self.assertIn("لوبیا", tokens)
        self.assertIn("بربری", tokens)
        self.assertIn("نان", tokens)
        self.assertIn("دو", tokens)
        self.assertIn("کف", tokens)
        self.assertIn("دست", tokens)

    def test_test8_dates_almond_evening(self):
        tokens = tokenize(ASR[8])
        self.assertIn("خرما", tokens)
        self.assertIn("بادام", tokens)
        self.assertIn("عصر", tokens)
        self.assertNotIn("عذر", tokens)

    def test_test9_300g_pasta_100g_mince(self):
        tokens = tokenize(ASR[9])
        self.assertIn("سیصد", tokens)
        self.assertIn("ماکارونی", tokens)
        self.assertIn("صد", tokens)
        self.assertIn("گرم", tokens)
        self.assertIn("گوشت", tokens)
        self.assertIn("کاسه", tokens)
        self.assertIn("ماست", tokens)
        self.assertNotIn("گرفت", tokens)
        self.assertNotIn("گوشه", tokens)

    def test_test10_glued_grams_no_sauce(self):
        tokens = tokenize(ASR[10])
        # "صدگرم" must split so 100g rice is parseable
        i = tokens.index("صد")
        self.assertEqual(tokens[i : i + 2], ["صد", "گرم"])
        self.assertIn("دویست", tokens)
        self.assertIn("سس", tokens)
        self.assertNotIn("سست", tokens)

    def test_test13_joojeh_kebab_half_rice(self):
        tokens = tokenize(ASR[13])
        self.assertIn("جوجه", tokens)
        self.assertIn("کباب", tokens)
        self.assertNotIn("برهنجشش", tokens)
        self.assertIn("برنج", tokens)

    def test_test14_creatine_5g(self):
        tokens = tokenize(ASR[14])
        self.assertIn("کراتین", tokens)
        self.assertIn("پنج", tokens)
        self.assertIn("گرم", tokens)
        self.assertIn("سفیده", tokens)
        self.assertNotIn("رس", tokens)

    def test_test15_daily_log_coffee_soup(self):
        tokens = tokenize(ASR[15])
        self.assertIn("قورمه", tokens)
        self.assertIn("موز", tokens)
        self.assertIn("قهوه", tokens)
        self.assertIn("سوپ", tokens)
        self.assertIn("عصر", tokens)
        joined = " ".join(tokens)
        self.assertIn("میان وعده", joined)

    def test_clean_sentence_untouched(self):
        src = "برای ناهار دویست گرم مرغ و صد گرم برنج خوردم"
        self.assertEqual(correct_asr_text(src), src)

    def test_unit_matcher_accepts_gereft(self):
        self.assertEqual(find_unit(["گرفت"], 0), ("گرم", 1))
        self.assertEqual(find_unit(["گرهام"], 0), ("گرم", 1))
        self.assertEqual(find_unit(["لیون"], 0), ("لیوان", 1))


class ExtractAfterRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def _foods(self, n: int) -> list[str]:
        return [item["food"] for item in extract(ASR[n], self.db)["items"] if item.get("food")]

    def test_test2_recovers_eggs_and_tea(self):
        foods = self._foods(2)
        self.assertTrue(any("تخم" in f for f in foods), foods)
        self.assertTrue(any("چای" in f for f in foods), foods)

    def test_test9_recovers_pasta_and_mince_grams(self):
        result = extract(ASR[9], self.db)
        by_food = {item["food"]: item for item in result["items"] if item.get("food")}
        pasta = next((item for name, item in by_food.items() if "ماکارون" in name), None)
        meat = next((item for name, item in by_food.items() if "گوشت" in name), None)
        self.assertIsNotNone(pasta, result["items"])
        self.assertIsNotNone(meat, result["items"])
        assert pasta is not None and meat is not None
        self.assertEqual(pasta.get("quantity"), 300)
        self.assertEqual(pasta.get("unit"), "گرم")
        self.assertEqual(meat.get("quantity"), 100)
        self.assertEqual(meat.get("unit"), "گرم")

    def test_test10_splits_100g_rice(self):
        result = extract(ASR[10], self.db)
        rice = next((item for item in result["items"] if item.get("food") and "برنج" in item["food"]), None)
        chicken = next((item for item in result["items"] if item.get("food") and "مرغ" in item["food"]), None)
        self.assertIsNotNone(rice, result["items"])
        self.assertIsNotNone(chicken, result["items"])
        assert rice is not None and chicken is not None
        self.assertEqual(rice.get("quantity"), 100)
        self.assertEqual(chicken.get("quantity"), 200)

    def test_test14_three_whites(self):
        result = extract(ASR[14], self.db)
        items = result["items"]
        whites = next((item for item in items if item.get("food") and "سفیده" in item["food"]), None)
        self.assertIsNotNone(whites, items)
        assert whites is not None
        self.assertEqual(whites.get("quantity"), 3)


if __name__ == "__main__":
    unittest.main(verbosity=2)
