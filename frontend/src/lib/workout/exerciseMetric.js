// Personal records used to be weight-only, so the "ثبت وزنه‌ها" panel dropped
// any exercise the student did at bodyweight. Every logged set now carries a
// metric kind saying what "better" means for that movement; this mirrors
// backend/internal/service/exercise_metric.go so the client can pick the right
// input and the right label without a round-trip.

export const METRIC_WEIGHT = "weight";
export const METRIC_REPS = "reps";
export const METRIC_HOLD = "hold";

const ISOMETRIC_HINTS = [
  "پلانک", "plank",
  "وال سیت", "wall sit",
  "هالو هولد", "hollow hold",
  "ال‌سیت", "ال سیت", "l-sit", "l sit",
  "وی‌سیت", "وی سیت", "v-sit",
  "بالانس روی دست", "handstand",
  "پلانچ", "planche",
  "فرانت لِوِر", "فرانت لور", "front lever",
  "بک لِوِر", "بک لور", "back lever",
  "آویزان مرده", "dead hang",
  "ایزومتریک", "isometric",
  "نگه‌داشتن", "نگه داشتن",
  "صلیب آهنین", "iron cross",
  "پرچم", "flag",
  "ابوالهول", "sphinx",
];

const BODYWEIGHT_EQUIPMENT = new Set([
  "وزن بدن",
  "با وزن بدن",
  "body weight",
  "bodyweight",
  "با کمک دستگاه",
  "assisted",
]);

const BODYWEIGHT_HINTS = [
  "شنا", "push-up", "push up", "pushup",
  "بارفیکس", "pull-up", "pull up", "chin-up", "chin up",
  "دیپ", "dip",
  "دراز و نشست", "sit-up", "sit up", "crunch", "کرانچ",
  "برپی", "burpee",
  "جامپینگ جک", "jumping jack",
  "کوهنورد", "mountain climber",
  "لانژ", "lunge",
  "ماسل‌آپ", "ماسل آپ", "muscle-up", "muscle up",
  "زیربغل وارونه", "inverted row",
  "اینچ‌ورم", "inchworm",
  "سوپرمن", "superman",
  "دد باگ", "dead bug",
  "پل سرینی", "glute bridge",
];

function containsAny(haystack, needles) {
  return needles.some((n) => n && haystack.includes(n));
}

/**
 * Pick the metric an exercise should be logged with.
 * @param {{name?: string, equipment?: string}} exercise
 * @returns {"weight"|"reps"|"hold"}
 */
export function detectMetricKind(exercise) {
  const name = String(exercise?.name ?? "").trim().toLowerCase();
  const equipment = String(exercise?.equipment ?? "").trim().toLowerCase();

  if (containsAny(name, ISOMETRIC_HINTS)) return METRIC_HOLD;
  if (BODYWEIGHT_EQUIPMENT.has(equipment)) return METRIC_REPS;
  if (containsAny(name, BODYWEIGHT_HINTS)) return METRIC_REPS;
  // Anything else is assumed to take external load; the user can still switch.
  return METRIC_WEIGHT;
}

export const METRIC_LABELS = {
  [METRIC_WEIGHT]: { input: "وزنه", unit: "کیلوگرم", short: "kg" },
  [METRIC_REPS]: { input: "تکرار", unit: "تکرار", short: "تکرار" },
  [METRIC_HOLD]: { input: "زمان", unit: "ثانیه", short: "ثانیه" },
};

/** Human-readable Persian summary of one record, e.g. "۳۰ تکرار". */
export function formatMetricValue(kind, { weightKg, reps, holdSeconds } = {}) {
  const fa = (n) => Number(n || 0).toLocaleString("fa-IR");
  switch (kind) {
    case METRIC_REPS:
      return `${fa(reps)} تکرار`;
    case METRIC_HOLD:
      if (holdSeconds >= 60 && holdSeconds % 60 === 0) {
        return `${fa(holdSeconds / 60)} دقیقه`;
      }
      return `${fa(holdSeconds)} ثانیه`;
    default:
      return reps > 0
        ? `${fa(weightKg)} کیلوگرم × ${fa(reps)}`
        : `${fa(weightKg)} کیلوگرم`;
  }
}

/** The number that has to go up for a record of this kind. */
export function metricValue(kind, record) {
  switch (kind) {
    case METRIC_REPS:
      return Number(record?.reps || 0);
    case METRIC_HOLD:
      return Number(record?.holdSeconds || 0);
    default:
      return Number(record?.weightKg || 0);
  }
}

/** The previous best that came with a record of this kind. */
export function previousBestValue(kind, record) {
  switch (kind) {
    case METRIC_REPS:
      return Number(record?.previousBestReps || 0);
    case METRIC_HOLD:
      return Number(record?.previousBestHoldSec || 0);
    default:
      return Number(record?.previousBestKg || 0);
  }
}

/**
 * Turn the per-exercise entries the log panel collected into the API `sets`
 * payload, dropping exercises with nothing entered.
 * @param {Array<{name: string, exerciseId?: number, equipment?: string, reps?: string}>} exercises
 * @param {Record<string, {kind: string, value: string}>} entries keyed by exercise name
 */
export function buildSetsPayload(exercises, entries) {
  return (exercises || [])
    .map((ex) => {
      const entry = entries?.[ex.name];
      const value = parseFloat(entry?.value);
      if (!Number.isFinite(value) || value <= 0) return null;
      const kind = entry?.kind || detectMetricKind(ex);
      const set = {
        exerciseName: ex.name,
        exerciseId: ex.exerciseId || undefined,
        equipment: ex.equipment || undefined,
        metricKind: kind,
        setNumber: 1,
      };
      if (kind === METRIC_REPS) {
        set.reps = Math.round(value);
      } else if (kind === METRIC_HOLD) {
        set.holdSeconds = Math.round(value);
      } else {
        set.weightKg = value;
        set.reps = firstInt(ex.reps);
      }
      return set;
    })
    .filter(Boolean);
}

/** Extract the leading integer from a prescribed rep string like "12" or "8-10". */
export function firstInt(value) {
  const m = String(value ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
