"""Household unit -> grams table (no audio, no kcal invention)."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.extract import extract  # noqa: E402
from app.foods_db import FoodDB  # noqa: E402
from app.household_units import convert, grams_each  # noqa: E402
from app.numbers import parse_number_at  # noqa: E402


class ConvertTests(unittest.TestCase):
    def test_two_plates_rice(self):
        got = convert("برنج پخته", 2, "بشقاب")
        self.assertEqual(got["estimated_grams"], 500)
        self.assertEqual(got["conversion_confidence"], "high")
        self.assertNotIn("kcal", got)

    def test_half_plate_rice(self):
        got = convert("برنج", 0.5, "بشقاب")
        self.assertEqual(got["estimated_grams"], 125)

    def test_one_and_half_glasses_milk(self):
        got = convert("شیر", 1.5, "لیوان")
        self.assertEqual(got["estimated_grams"], 360)

    def test_direct_grams_not_converted(self):
        got = convert("برنج", 100, "گرم")
        self.assertEqual(got["estimated_grams"], 100)
        self.assertEqual(got["conversion_confidence"], "high")

    def test_unknown_food_stays_null(self):
        got = convert("پیتزا", 1, "بشقاب")
        self.assertIsNone(got["estimated_grams"])
        self.assertEqual(got["conversion_confidence"], "unknown")

    def test_palm_not_used_for_soup(self):
        self.assertIsNone(grams_each("سوپ سبزیجات", "کف دست"))
        got = convert("سوپ", 1, "کف دست")
        self.assertIsNone(got["estimated_grams"])

    def test_tablespoon_honey(self):
        self.assertEqual(convert("عسل", 1, "قاشق غذاخوری")["estimated_grams"], 21)

    def test_teaspoon_sugar(self):
        self.assertEqual(convert("شکر", 1, "قاشق چایخوری")["estimated_grams"], 4)

    def test_egg_does_not_inherit_chicken_or_water(self):
        self.assertIsNone(grams_each("تخم مرغ آب پز", "بشقاب"))
        self.assertIsNone(grams_each("تخم مرغ آب پز", "لیوان"))
        self.assertIsNone(grams_each("تخم مرغ آب پز", "کف دست"))


class NumberParseTests(unittest.TestCase):
    def test_one_and_a_half(self):
        self.assertEqual(parse_number_at(["یک", "و", "نیم", "لیوان"], 0), (1.5, 3))

    def test_half_alone(self):
        self.assertEqual(parse_number_at(["نصف", "بشقاب"], 0), (0.5, 1))


class ExtractHouseholdTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = FoodDB()

    def test_two_plates_rice_kcal_from_db(self):
        result = extract("دو بشقاب برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertEqual(rice["grams"], 500)
        self.assertTrue(rice["estimated"])
        self.assertGreater(rice["kcal"], 0)
        self.assertGreater(result["total_kcal"], 0)

    def test_half_plate_rice(self):
        result = extract("نصف بشقاب برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertEqual(rice["grams"], 125)

    def test_one_and_half_glasses_milk(self):
        result = extract("یک و نیم لیوان شیر خوردم", self.db)
        milk = next(i for i in result["items"] if "شیر" in i["food"])
        self.assertEqual(milk["quantity"], 1.5)
        self.assertEqual(milk["unit"], "لیوان")
        self.assertEqual(milk["grams"], 360)
        self.assertGreater(milk["kcal"], 0)

    def test_hundred_grams_rice_not_estimated(self):
        result = extract("صد گرم برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertEqual(rice["grams"], 100)
        self.assertFalse(rice.get("estimated"))
        self.assertEqual(rice["unit"], "گرم")

    def test_palm_chicken(self):
        result = extract("یک کف دست مرغ خوردم", self.db)
        chicken = next(i for i in result["items"] if "مرغ" in i["food"])
        self.assertEqual(chicken["grams"], 80)
        self.assertTrue(chicken["estimated"])

    def test_palm_rice_unknown(self):
        result = extract("یک کف دست برنج خوردم", self.db)
        rice = next(i for i in result["items"] if "برنج" in i["food"])
        self.assertTrue(rice.get("needs_conversion"))
        self.assertIsNone(rice.get("kcal"))

    def test_teaspoon_honey(self):
        result = extract("یک قاشق چایخوری عسل خوردم", self.db)
        honey = next(i for i in result["items"] if "عسل" in i["food"])
        self.assertEqual(honey["grams"], 7)
        self.assertGreater(honey["kcal"], 0)


if __name__ == "__main__":
    unittest.main()
