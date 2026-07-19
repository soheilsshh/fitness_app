const STORAGE_KEY = "fitino:funnel:ali-rashidabadi:v1";
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const QUIZ_KEYS = [
  "primaryGoal",
  "activityLevel",
  "trainingEnv",
  "experience",
  "nutritionChallenge",
  "mainObstacle",
  "commitment",
];

export function allQuizAnswered(answers = {}) {
  return QUIZ_KEYS.every((k) => Boolean(answers[k]));
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Load persisted funnel draft from localStorage (browser only). */
export function loadFunnelDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = safeParse(raw);
    if (!data || typeof data !== "object") return null;
    if (data.savedAt && Date.now() - Number(data.savedAt) > DRAFT_TTL_MS) {
      clearFunnelDraft();
      return null;
    }
    return normalizeDraft(data);
  } catch {
    return null;
  }
}

/**
 * Map transient stages to a resumable stage so the user never lands mid-animation.
 */
export function normalizeDraft(data) {
  const answers = data.answers && typeof data.answers === "object" ? { ...data.answers } : {};
  let stage = data.stage || "hero";
  let qIndex = Number.isFinite(data.qIndex) ? Math.max(0, Math.min(6, data.qIndex)) : 0;

  const age = data.age ?? answers.age ?? "";
  const heightCm = data.heightCm ?? answers.heightCm ?? "";
  const weightKg = data.weightKg ?? answers.weightKg ?? "";
  const hasMetrics = Boolean(Number(age) && Number(heightCm) && Number(weightKg));
  const quizDone = allQuizAnswered(answers);

  // Checkout after lead submit — resume payment page.
  if (stage === "checkout" && data.checkoutToken) {
    return {
      stage: "checkout",
      checkoutToken: String(data.checkoutToken),
      answers,
      qIndex: 6,
      age: String(age || ""),
      heightCm: String(heightCm || ""),
      weightKg: String(weightKg || ""),
      fullName: data.fullName || "",
      phone: data.phone || "",
    };
  }

  // Transient UI stages → stable resume points.
  if (stage === "analyzing" || stage === "preparing" || stage === "locking") {
    if (quizDone && hasMetrics) stage = "result";
    else if (quizDone) stage = "metrics";
    else stage = "quiz";
  }

  // Had progress but stage still hero (old drafts / interrupted start).
  if (stage === "hero" && (quizDone || Object.keys(answers).length > 0)) {
    if (quizDone && hasMetrics) stage = "result";
    else if (quizDone) stage = "metrics";
    else stage = "quiz";
  }

  // Advance qIndex to first unanswered question when resuming quiz.
  if (stage === "quiz") {
    const firstOpen = QUIZ_KEYS.findIndex((k) => !answers[k]);
    if (firstOpen >= 0) qIndex = firstOpen;
    else if (quizDone) {
      stage = hasMetrics ? "result" : "metrics";
      qIndex = 6;
    }
  }

  if ((stage === "result" || stage === "lead") && !quizDone) {
    stage = "quiz";
  }
  if ((stage === "result" || stage === "lead") && quizDone && !hasMetrics) {
    stage = "metrics";
  }

  return {
    stage,
    qIndex,
    answers,
    age: age === "" || age == null ? "" : String(age),
    heightCm: heightCm === "" || heightCm == null ? "" : String(heightCm),
    weightKg: weightKg === "" || weightKg == null ? "" : String(weightKg),
    fullName: data.fullName || "",
    phone: data.phone || "",
    checkoutToken: data.checkoutToken || "",
  };
}

/** Avoid recursive normalize when merging saves (loadFunnelDraft normalizes). */
function readRawDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParse(raw);
  } catch {
    return null;
  }
}

export function saveFunnelDraft(partial) {
  if (typeof window === "undefined") return;
  try {
    const prev = readRawDraft() || {};
    const next = {
      ...prev,
      ...partial,
      answers:
        partial.answers !== undefined
          ? partial.answers
          : prev.answers && typeof prev.answers === "object"
            ? prev.answers
            : {},
      savedAt: Date.now(),
    };
    const clean = normalizeDraft(next);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...clean, savedAt: Date.now() })
    );
  } catch {
    // Quota / private mode — ignore.
  }
}

export function clearFunnelDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasFunnelProgress(draft) {
  if (!draft) return false;
  if (draft.stage === "checkout" && draft.checkoutToken) return true;
  if (draft.stage && draft.stage !== "hero") return true;
  if (draft.answers && Object.keys(draft.answers).length > 0) return true;
  return false;
}
