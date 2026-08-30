"""Committed vs candidate matching — series-2 ASR strings.

Run with: python test_commit.py
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.extract import extract  # noqa: E402
from app.foods_db import BLOCKED_FOOD_NAMES, BLOCKED_QUERIES, FoodDB, is_committed  # noqa: E402

# Whisper output after spelling repair (series 2). Labels are script test ids.
SERIES2 = {
    1: "صبح امروز برای صبحانه صده سردت تخمان خوردم دو تا از تخماقا کامل بود و یکی فقط سفیده بود کنار اون یک کف دست نار سنگرک و یک لی لیوان چای بدون قند هم داشتم",
    2: "حس دوم برای ناهار یک بشقاب متوسط برنج خورده ام به بود یک خوره باحدودود یک خورش قوربه سبزی داخله خورایش هم فکر کنم چند تاتی که گوشت خوراشتی بود کنار قضا هم یک لیوان دوغ کم نمک مشیدم",
    4: "امروز ظهر خوراک مرغ داشتم گزود دویست که را مر غبطه پخته خوردم با کمی برنج معظورم مرگ معمولی بود نه مره سخاریه",
    7: "بست هفت امرو صبح دو عدد خرما با یک لیوان چیر خوردم ظهر یک پرس عدست پلو خوردهام عصر هم یک سیب و حوده ده عد بادون خورم شب هم سوپ سبزجاد خورتم",
    10: "بست ده بعد از وعده شام خوردم شامل صد و پنجاه گرم فیلهی مرغ گریل شده یک کاسه سالاد بدون سس و با ده سد گرهم سیبزمینی آبپز",
    14: "چه چه چارده امروز صبح به یک عدد تخم مرغ دو کف دست نان سنگکک و چای خوردم برای ناهار برنج با خورش کرف ساشتم از شیه یک مز خوردهام و قبل خواب هم یک لیوان شیر کمچر میشدم",
    15: "به سه سپونجاه این روز خیلی دقیق یادم نیست ولی صوویه چیزی خوردم مثل نیمرو با نان ظرفه کنم با کارانی بوده یک بشقاب معمولی شب و هم یک مقدار کمپ سالاد و مرخ خورده",
    16: "رس شونزه چهار عدد خرما سه عداد گردو دو لیوان آب یک قاشق تره بادام زم زبینی خوردم",
    19: "ا این موزده یک پیلزا سفارش شدم ولی فقط یک چارمونش رو خوردم",
    20: "ه چیگر چی امروز خوردم رو میگم صبحانه نان پنی و گردو ظهر قیبه و برنج عصف قه و شبه شب هم مرغ و سالاد",
}


class FindGuardsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_be_never_matches_quince(self):
        self.assertIn("به", BLOCKED_QUERIES)
        self.assertIsNone(self.db.find("به"))
        self.assertIsNone(self.db.find("غبطه پخته"))
        for name in BLOCKED_FOOD_NAMES:
            self.assertIsNone(self.db.find(name))

    def test_short_garbage_does_not_fuzzy(self):
        self.assertIsNone(self.db.find("کنار"))
        self.assertIsNone(self.db.find("تارت"))
        self.assertIsNone(self.db.find("بادون"))
        self.assertIsNone(self.db.find("گرمک"))

    def test_walnut_short_staple_is_exact(self):
        match = self.db.find("گردو")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.name, "گردو")
        self.assertTrue(is_committed(match, "گردو"))

    def test_user_egg_panel_names(self):
        whole = self.db.find("تخم مرغ کامل")
        white = self.db.find("سفیده تخم مرغ")
        yolk = self.db.find("زرده تخم مرغ")
        self.assertIsNotNone(whole)
        self.assertIsNotNone(white)
        self.assertIsNotNone(yolk)
        assert whole is not None and white is not None and yolk is not None
        self.assertEqual(whole.name, "تخم مرغ کامل")
        self.assertEqual(white.name, "سفیده تخم مرغ")
        self.assertEqual(yolk.name, "زرده تخم مرغ")
        self.assertEqual(whole.canonical.get("calories"), 143)
        self.assertEqual(white.canonical.get("calories"), 52)
        self.assertEqual(yolk.canonical.get("calories"), 322)
        self.assertEqual(whole.canonical.get("cholesterol"), 372)
        self.assertEqual(white.canonical.get("cholesterol"), 0)
        self.assertEqual(yolk.canonical.get("cholesterol"), 1085)

    def test_egg_alias_beats_ostrich(self):
        match = self.db.find("تخم مرغ")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertIn("تخم مرغ", match.name)
        self.assertNotIn("شترمرغ", match.name)
        self.assertTrue(is_committed(match, "تخم مرغ"))

    def test_tea_without_sugar_is_not_unsalted_chips(self):
        match = self.db.find("چای بدون قند")
        if match is not None:
            self.assertNotIn("چیپس", match.name)
            self.assertFalse(is_committed(match, "چای بدون قند"))

    def test_nane_pani_fuzzy_is_candidate_not_committed(self):
        match = self.db.find("نان پنی")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertIn("قندی", match.name)
        self.assertFalse(is_committed(match, "نان پنی"))


class Series2CommitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def _foods(self, n: int) -> list[str]:
        return [item["food"] for item in extract(SERIES2[n], self.db)["items"] if item.get("food")]

    def test_test1_no_unsalted_chips_in_items(self):
        result = extract(SERIES2[1], self.db)
        foods = self._foods(1)
        self.assertFalse(any("چیپس" in f for f in foods), foods)
        self.assertFalse(any(f == "قند" for f in foods), foods)
        for row in result["items"]:
            self.assertIn("spoken", row)
        self.assertEqual(
            sum(item["kcal"] for item in result["items"] if item.get("kcal") and "چیپس" in item.get("food", "")),
            0,
        )
        self.assertLess(result["total_kcal"], 200)

    def test_test2_no_quince_or_tart(self):
        result = extract(SERIES2[2], self.db)
        foods = self._foods(2)
        self.assertFalse(any(f == "به" or f.startswith("به ") for f in foods), foods)
        self.assertFalse(any("تارت" in f for f in foods), foods)
        self.assertFalse(any("تارت" in c.get("food", "") for c in result["candidates"]))

    def test_test4_garbled_chicken_is_not_cooked_quince(self):
        result = extract(SERIES2[4], self.db)
        foods = self._foods(4)
        self.assertFalse(any("به پخته" in f for f in foods), foods)
        self.assertFalse(any("به پخته" in c.get("food", "") for c in result["candidates"]))
        self.assertLess(result["total_kcal"], 1000)

    def test_test7_badon_is_not_brownie(self):
        result = extract(SERIES2[7], self.db)
        foods = self._foods(7)
        self.assertFalse(any("براونی" in f for f in foods), foods)
        dates = [item for item in result["items"] if item.get("food") and "خرما" in item["food"]]
        self.assertTrue(dates)
        self.assertEqual(dates[0].get("quantity"), 2)

    def test_test10_no_garmsak_or_potato_flour(self):
        result = extract(SERIES2[10], self.db)
        foods = self._foods(10)
        self.assertFalse(any("گرمک" in f for f in foods), foods)
        self.assertFalse(any("آرد سیب" in f for f in foods), foods)
        self.assertLess(result["total_kcal"], 1500)

    def test_test14_no_ostrich_egg_committed(self):
        foods = self._foods(14)
        self.assertFalse(any("شترمرغ" in f for f in foods), foods)
        self.assertTrue(any("تخم مرغ" in f for f in foods), foods)

    def test_test15_garbled_pasta_is_not_muesli(self):
        result = extract(SERIES2[15], self.db)
        foods = self._foods(15)
        self.assertFalse(any("موسلی" in f for f in foods), foods)
        self.assertFalse(any("موسلی" in c.get("food", "") for c in result["candidates"]))

    def test_test16_staple_counts_stay_committed(self):
        result = extract(SERIES2[16], self.db)
        by_food = {item["food"]: item for item in result["items"] if item.get("food")}
        dates = next((item for name, item in by_food.items() if "خرما" in name), None)
        walnuts = next((item for name, item in by_food.items() if "گردو" in name), None)
        water = next((item for name, item in by_food.items() if name == "آب" or "آب" == name), None)
        peanut = next((item for name, item in by_food.items() if "بادام زمینی" in name), None)
        self.assertIsNotNone(dates, result["items"])
        self.assertIsNotNone(walnuts, result["items"])
        self.assertIsNotNone(water, result["items"])
        self.assertIsNotNone(peanut, result["items"])
        assert dates is not None and walnuts is not None and water is not None and peanut is not None
        self.assertEqual(dates.get("quantity"), 4)
        self.assertEqual(walnuts.get("quantity"), 3)
        self.assertEqual(water.get("quantity"), 2)
        self.assertEqual(water.get("unit"), "لیوان")
        self.assertEqual(peanut.get("quantity"), 1)
        self.assertTrue(any(item.get("spoken") for item in result["items"]))
        self.assertGreater(result["total_kcal"], 0)

    def test_test19_moozdeh_is_not_committed_banana(self):
        foods = self._foods(19)
        self.assertFalse(any(f == "موز" for f in foods), foods)

    def test_test20_nane_pani_is_not_sweet_bread(self):
        foods = self._foods(20)
        self.assertFalse(any("قندی" in f for f in foods), foods)

    def test_candidates_do_not_add_to_total(self):
        result = extract(SERIES2[1], self.db)
        item_kcal = sum(item["kcal"] for item in result["items"] if item.get("kcal") is not None)
        self.assertEqual(result["total_kcal"], round(item_kcal, 1))
        for cand in result["candidates"]:
            self.assertIn("spoken", cand)
            self.assertIn("food", cand)
            self.assertIn("match_score", cand)
            self.assertNotIn("kcal", cand)
            self.assertNotIn("grams", cand)
            self.assertNotIn("protein_g", cand)
            self.assertNotIn("carbs_g", cand)
            self.assertNotIn("fat_g", cand)

    def test_nane_pani_candidate_has_no_kcal(self):
        result = extract("نان پنی", self.db)
        self.assertEqual(result["total_kcal"], 0)
        for cand in result["candidates"]:
            self.assertNotIn("kcal", cand)
            self.assertNotIn("grams", cand)
            self.assertNotIn("protein_g", cand)
        for item in result["items"]:
            self.assertFalse("قندی" in item.get("food", ""))

    def test_meal_words_tag_following_foods(self):
        result = extract("صبحانه نان و پنیر ناهار برنج", self.db)
        breakfast = [i for i in result["items"] if i.get("meal") == "breakfast"]
        lunch = [i for i in result["items"] if i.get("meal") == "lunch"]
        self.assertTrue(any("نان" in (i.get("food") or "") for i in breakfast), result["items"])
        self.assertTrue(any("برنج" in (i.get("food") or "") for i in lunch), result["items"])


class Report50P0Tests(unittest.TestCase):
    """Regression cases from calorie_report_50.json dangerous commits."""

    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_clip1_no_chicken_for_grilled_tomato(self):
        text = (
            "برای ناهار یک بازچره کباب کوبیده خوردم دو سیخ کباب بود "
            "با یک با یک بشقاب برنج و یک گوجه کبابی"
        )
        result = extract(text, self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("جوجه" in f for f in foods), foods)
        tomato = next((i for i in result["items"] if i.get("spoken") == "گوجه کبابی"), None)
        if tomato is not None:
            self.assertIn("گوجه", tomato["food"])
            self.assertNotIn("جوجه", tomato["food"])

    def test_clip9_plate_on_pasta_not_meat(self):
        text = "امروز ماکارونی خوردم حدود یک بشقاب متوسط با گوشت چرخ کرده"
        result = extract(text, self.db)
        pasta = next(i for i in result["items"] if "ماکارونی" in i["food"])
        meat = next((i for i in result["items"] if "گوشت" in i["food"]), None)
        self.assertEqual(pasta.get("unit"), "بشقاب")
        self.assertIsNotNone(pasta.get("kcal"))
        if meat is not None:
            self.assertNotEqual(meat.get("unit"), "بشقاب", meat)

    def test_clip13_potato_not_apple(self):
        text = "برای شام دویست گرم سیب زمینی آب پس خوردم"
        result = extract(text, self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any(f == "سیب قرمز" for f in foods), foods)
        potato = next((i for i in result["items"] if "سیب زمینی" in i["food"]), None)
        self.assertIsNotNone(potato, result["items"])
        assert potato is not None
        self.assertEqual(potato.get("quantity"), 200)
        self.assertEqual(potato.get("unit"), "گرم")
        self.assertGreater(potato.get("kcal") or 0, 0)

    def test_clip31_correction_demotes_rice(self):
        text = "اول گفتم برنج خوردم ولی اشتباه بود منظورم سیب زمینی بود"
        result = extract(text, self.db)
        committed = [i["food"] for i in result["items"]]
        self.assertFalse(any("برنج" in f for f in committed), committed)
        self.assertTrue(
            any(c.get("spoken") == "برنج" or "برنج" in (c.get("food") or "") for c in result["corrections"]),
            result["corrections"],
        )
        self.assertFalse(any("برنج" in (c.get("food") or "") for c in result["candidates"]))
        self.assertEqual(result["total_kcal"], 0)

    def test_clip39_neh_is_not_nine_milk(self):
        text = "یک لیوان شیر خوردم نه شیر کاهو"
        result = extract(text, self.db)
        milk_items = [i for i in result["items"] if "شیر" in i.get("food", "")]
        self.assertEqual(len(milk_items), 1, milk_items)
        self.assertEqual(milk_items[0].get("quantity"), 1)
        self.assertEqual(milk_items[0].get("unit"), "لیوان")
        self.assertLess(result["total_kcal"], 200)


class SupplementVoiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_generic_whey_alias(self):
        match = self.db.find("پروتئین وی")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.name, "وی بدون برند")

    def test_bare_whey_alias(self):
        match = self.db.find("وی")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.name, "وی بدون برند")

    def test_brand_whey_kaleh(self):
        match = self.db.find("وی کاله")
        self.assertIsNotNone(match)
        assert match is not None
        self.assertEqual(match.name, "وی کاله")

    def test_scoop_whey_kcal(self):
        result = extract("یک اسکوپ پروتئین وی مصرف کردم", self.db)
        whey = next(i for i in result["items"] if "وی" in i["food"])
        self.assertEqual(whey["unit"], "اسکوپ")
        self.assertEqual(whey["quantity"], 1)
        self.assertGreater(whey.get("kcal") or 0, 0)


class CleanSentenceRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_bread_and_cheese_still_splits(self):
        result = extract("نان پنیر خوردم", self.db)
        foods = [item["food"] for item in result["items"]]
        self.assertTrue(any("نان" in f for f in foods), foods)
        self.assertTrue(any("پنیر" in f for f in foods), foods)

    def test_100g_rice_still_committed(self):
        result = extract("صد گرم برنج خوردم", self.db)
        rice = next(item for item in result["items"] if "برنج" in item["food"])
        self.assertEqual(rice["quantity"], 100)
        self.assertEqual(rice["unit"], "گرم")
        self.assertEqual(rice["spoken"], "برنج")


class NoGuessQuantityTests(unittest.TestCase):
    """Extractor must not invent quantity, unit, or kcal."""

    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_chand_ta_almond_has_no_quantity(self):
        result = extract("چند تا بادام خوردم", self.db)
        almond = next(i for i in result["items"] if "بادام" in i["food"])
        self.assertIsNone(almond.get("quantity"))
        self.assertIsNone(almond.get("unit"))
        self.assertTrue(almond.get("needs_quantity"))
        self.assertIsNone(almond.get("kcal"))
        self.assertEqual(result["total_kcal"], 0)
        self.assertTrue(result["needs_quantity"])
        units = {u["unit"] for u in almond.get("available_units") or []}
        self.assertIn("گرم", units)
        self.assertIn("عدد", units)
        self.assertIsNotNone(almond.get("kcal_per_100g"))
        self.assertGreater(almond["kcal_per_100g"], 0)

    def test_ye_kam_rice_has_no_default_grams(self):
        result = extract("یه کم برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertIsNone(rice.get("quantity"))
        self.assertIsNone(rice.get("unit"))
        self.assertTrue(rice.get("needs_quantity"))
        self.assertIsNone(rice.get("kcal"))
        self.assertEqual(result["total_kcal"], 0)

    def test_three_eggs_committed(self):
        result = extract("سه تا تخم مرغ خوردم", self.db)
        egg = next(i for i in result["items"] if "تخم مرغ" in i["food"])
        self.assertEqual(egg.get("quantity"), 3)
        self.assertEqual(egg.get("unit"), "عدد")
        self.assertFalse(egg.get("needs_quantity"))
        self.assertGreater(egg.get("kcal") or 0, 0)
        self.assertGreater(result["total_kcal"], 0)

    def test_two_glasses_milk(self):
        result = extract("دو لیوان شیر خوردم", self.db)
        milk = next(i for i in result["items"] if "شیر" in i["food"])
        self.assertEqual(milk.get("quantity"), 2)
        self.assertEqual(milk.get("unit"), "لیوان")
        self.assertFalse(milk.get("needs_quantity"))
        if milk.get("kcal") is None:
            self.assertTrue(milk.get("needs_conversion"))
            units = {u["unit"] for u in milk.get("available_units") or []}
            self.assertIn("گرم", units)
        else:
            self.assertGreater(milk["kcal"], 0)

    def test_negated_rice_not_consumed(self):
        result = extract("برنج نخوردم، فقط مرغ و سالاد خوردم", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("برنج" in f for f in foods), foods)
        self.assertTrue(any("مرغ" in f for f in foods), foods)
        self.assertTrue(any("سالاد" in f for f in foods), foods)
        self.assertTrue(
            any("برنج" in (n.get("food") or "") or n.get("spoken") == "برنج" for n in result["negated"]),
            result["negated"],
        )

    def test_rice_correction_not_consumed(self):
        result = extract("اول گفتم برنج خوردم ولی اشتباه بود، منظورم سیب زمینی بود.", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("برنج" in f for f in foods), foods)
        self.assertTrue(any("سیب زمینی" in f for f in foods), foods)
        self.assertTrue(any("برنج" in (c.get("food") or "") for c in result["corrections"]))
        self.assertEqual(result["total_kcal"], 0)

    def test_badon_is_candidate_not_committed(self):
        result = extract("بادون خوردم", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("براونی" in f for f in foods), foods)
        if result["items"]:
            for item in result["items"]:
                self.assertGreaterEqual(item.get("match_score") or 0, 90)
        if result["candidates"]:
            for c in result["candidates"]:
                self.assertEqual(c.get("status"), "candidate")
                self.assertNotIn("kcal", c)

    def test_one_egg_is_not_ostrich(self):
        result = extract("یک عدد تخم مرغ", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("شترمرغ" in f for f in foods), foods)
        self.assertTrue(any("تخم مرغ" in f for f in foods), foods)

    def test_tea_without_sugar_not_chips(self):
        result = extract("چای بدون قند", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("چیپس" in f for f in foods), foods)
        self.assertFalse(any("چیپس" in (c.get("food") or "") for c in result["candidates"]))

    def test_nane_pani_not_committed_sweet_bread(self):
        result = extract("نان پنی", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("قندی" in f for f in foods), foods)
        self.assertEqual(result["total_kcal"], 0)

    def test_candidate_kcal_never_in_total(self):
        result = extract("نان پنی", self.db)
        for c in result["candidates"]:
            self.assertNotIn("kcal", c)
            self.assertNotIn("grams", c)
        self.assertEqual(result["total_kcal"], 0)

    def test_plate_of_rice_uses_household_grams(self):
        result = extract("یک بشقاب برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertEqual(rice.get("quantity"), 1)
        self.assertEqual(rice.get("unit"), "بشقاب")
        self.assertEqual(rice.get("grams"), 250)
        self.assertTrue(rice.get("estimated"))
        self.assertFalse(rice.get("needs_conversion"))
        self.assertGreater(rice.get("kcal") or 0, 0)
        units = {u["unit"]: u["grams_per_unit"] for u in rice.get("available_units") or []}
        self.assertEqual(units.get("بشقاب"), 250)

    def test_items_committed_candidates_status(self):
        result = extract("سه تا تخم مرغ خوردم", self.db)
        for item in result["items"]:
            self.assertEqual(item.get("status"), "committed")
            self.assertIn("spoken", item)
        fuzzy = extract("نان پنی", self.db)
        self.assertFalse(any("قندی" in (i.get("food") or "") for i in fuzzy["items"]))
        for cand in fuzzy["candidates"]:
            self.assertEqual(cand.get("status"), "candidate")
            self.assertNotIn("kcal", cand)
            self.assertIn("spoken", cand)

    def test_sauce_not_consumed_when_without(self):
        result = extract("همبرگر با پنیر، بدون سس", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any("سس" in f for f in foods), foods)
        self.assertTrue(any("همبرگر" in f for f in foods), foods)

    def test_masraf_nakardam_not_consumed(self):
        result = extract("قند مصرف نکردم فقط چای خوردم", self.db)
        foods = [i["food"] for i in result["items"]]
        self.assertFalse(any(f == "قند" for f in foods), foods)
        self.assertTrue(any("چای" in f for f in foods), foods)

    def test_correction_keeps_spoken_original(self):
        result = extract("اول گفتم برنج خوردم ولی اشتباه بود، منظورم سیب زمینی بود.", self.db)
        self.assertTrue(result["corrections"])
        row = result["corrections"][0]
        self.assertEqual(row.get("spoken_original"), "برنج")
        self.assertEqual(row.get("spoken_corrected"), "سیب زمینی")
        self.assertEqual(result["total_kcal"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
