/// Port of frontend/src/lib/tools/bmiCalculator.js + calorieCalculator.js

class BmiCategory {
  const BmiCategory({
    required this.id,
    required this.label,
    required this.min,
    required this.max,
    required this.hint,
  });
  final String id;
  final String label;
  final double min;
  final double max;
  final String hint;
}

const bmiCategories = [
  BmiCategory(
    id: 'underweight',
    label: 'کم‌وزن',
    min: 0,
    max: 18.5,
    hint: 'BMI کمتر از ۱۸.۵ — ممکن است نیاز به افزایش وزن سالم باشد.',
  ),
  BmiCategory(
    id: 'normal',
    label: 'نرمال',
    min: 18.5,
    max: 25,
    hint: 'BMI بین ۱۸.۵ تا ۲۴.۹ — محدوده سالم برای بزرگسالان.',
  ),
  BmiCategory(
    id: 'overweight',
    label: 'اضافه‌وزن',
    min: 25,
    max: 30,
    hint: 'BMI بین ۲۵ تا ۲۹.۹ — احتمال افزایش ریسک‌های سلامتی.',
  ),
  BmiCategory(
    id: 'obese',
    label: 'چاقی',
    min: 30,
    max: double.infinity,
    hint: 'BMI ۳۰ و بالاتر — توصیه به مشورت با پزشک یا متخصص تغذیه.',
  ),
];

const bmiScaleMin = 15.0;
const bmiScaleMax = 40.0;

class BmiResult {
  const BmiResult({
    required this.bmi,
    required this.category,
    required this.scalePosition,
  });
  final double bmi;
  final BmiCategory? category;
  final double scalePosition;
}

BmiResult? calculateBmiResult(double weightKg, double heightCm) {
  if (weightKg <= 0 || heightCm <= 0) return null;
  final heightM = heightCm / 100;
  final raw = weightKg / (heightM * heightM);
  final bmi = (raw * 10).round() / 10.0;
  BmiCategory? category;
  for (final c in bmiCategories) {
    if (bmi >= c.min && bmi < c.max) {
      category = c;
      break;
    }
  }
  final clamped = bmi.clamp(bmiScaleMin, bmiScaleMax);
  final pos = ((clamped - bmiScaleMin) / (bmiScaleMax - bmiScaleMin)) * 100;
  return BmiResult(bmi: bmi, category: category, scalePosition: pos);
}

class ActivityLevel {
  const ActivityLevel(this.id, this.label, this.multiplier, this.hint);
  final String id;
  final String label;
  final double multiplier;
  final String hint;
}

const activityLevels = [
  ActivityLevel('sedentary', 'کم‌تحرک', 1.2, 'کار نشسته، ورزش تقریباً ندارید'),
  ActivityLevel('light', 'فعالیت سبک', 1.375, 'ورزش سبک ۱–۳ روز در هفته'),
  ActivityLevel('moderate', 'متوسط', 1.55, 'ورزش متوسط ۳–۵ روز در هفته'),
  ActivityLevel('active', 'پرتحرک', 1.725, 'ورزش سنگین ۶–۷ روز در هفته'),
  ActivityLevel(
      'very_active', 'بسیار پرتحرک', 1.9, 'کار فیزیکی سنگین یا تمرین دو بار در روز'),
];

class CalorieGoal {
  const CalorieGoal(this.id, this.label, this.adjustment);
  final String id;
  final String label;
  final int adjustment;
}

const calorieGoals = [
  CalorieGoal('lose', 'کاهش وزن', -500),
  CalorieGoal('maintain', 'نگهداری وزن', 0),
  CalorieGoal('gain', 'افزایش وزن', 400),
];

class CaloriePlan {
  const CaloriePlan({this.bmr, this.tdee, this.recommended});
  final int? bmr;
  final int? tdee;
  final int? recommended;
}

CaloriePlan calculateCaloriePlan({
  required int age,
  required String gender,
  required double heightCm,
  required double weightKg,
  required String activityLevel,
  required String goal,
}) {
  if (age < 1 || heightCm <= 0 || weightKg <= 0) {
    return const CaloriePlan();
  }
  final base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  final bmr = gender == 'female' ? base - 161 : base + 5;
  ActivityLevel? level;
  for (final l in activityLevels) {
    if (l.id == activityLevel) {
      level = l;
      break;
    }
  }
  final tdee = level == null ? null : bmr * level.multiplier;
  CalorieGoal? g;
  for (final x in calorieGoals) {
    if (x.id == goal) {
      g = x;
      break;
    }
  }
  final recommended = tdee == null || g == null
      ? null
      : (tdee + g.adjustment).round().clamp(1200, 100000);
  return CaloriePlan(
    bmr: bmr.round(),
    tdee: tdee?.round(),
    recommended: recommended,
  );
}
