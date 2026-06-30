/** @typedef {{ setNumber: number, reps: string, isAmrap: boolean }} ExerciseSetDetail */

export function normalizeSetsDetails(details) {
  if (!Array.isArray(details)) return [];
  return details.map((d, i) => ({
    setNumber: d.setNumber > 0 ? d.setNumber : d.set_number > 0 ? d.set_number : i + 1,
    reps: String(d.reps ?? "").trim(),
    isAmrap: Boolean(d.isAmrap ?? d.is_amrap),
  }));
}

export function createSetsDetails(count, defaultReps = "12") {
  const n = Math.max(0, parseInt(count, 10) || 0);
  return Array.from({ length: n }, (_, i) => ({
    setNumber: i + 1,
    reps: String(defaultReps ?? "").trim(),
    isAmrap: false,
  }));
}

export function resizeSetsDetails(existing, newCount, defaultReps = "12") {
  const count = Math.max(0, parseInt(newCount, 10) || 0);
  const current = normalizeSetsDetails(existing);
  const fallbackReps = String(defaultReps ?? "").trim() || "12";
  const result = [];
  for (let i = 0; i < count; i++) {
    const prev = current[i];
    result.push({
      setNumber: i + 1,
      reps: prev?.reps ?? fallbackReps,
      isAmrap: prev?.isAmrap ?? false,
    });
  }
  return result;
}

export function summarizeSetReps(setsDetails) {
  const details = normalizeSetsDetails(setsDetails);
  if (!details.length) return "";
  return details
    .map((s) => {
      if (s.isAmrap) return "AMRAP";
      return String(s.reps || "").trim();
    })
    .filter(Boolean)
    .join("/");
}

export function normalizeWorkoutSystemType(value) {
  const t = String(value ?? "").trim().toLowerCase();
  return t || "normal";
}

export function normalizeSupersetId(value) {
  const id = String(value ?? "").trim();
  return id || null;
}

export const WORKOUT_SYSTEM_LABELS = {
  normal: "عادی",
  superset: "سوپرست",
  giant_set: "جاینت‌ست",
  circuit: "ست دایره‌ای",
};

export const WORKOUT_LINK_OPTIONS = [
  { value: "superset", label: "ایجاد سوپرست" },
  { value: "giant_set", label: "ایجاد جاینت‌ست" },
  { value: "circuit", label: "ایجاد ست دایره‌ای" },
];

export function getWorkoutSystemLabel(type) {
  return WORKOUT_SYSTEM_LABELS[normalizeWorkoutSystemType(type)] || WORKOUT_SYSTEM_LABELS.normal;
}

export function generateSupersetId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** @returns {{ kind: 'single' | 'group', supersetId?: string, workoutSystemType?: string, exercises: object[] }[]} */
export function groupExercisesForDisplay(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) return [];

  const groups = [];
  const processed = new Set();

  for (const ex of exercises) {
    const trackId = ex.uid ?? ex.key;
    if (processed.has(trackId)) continue;

    const supersetId = normalizeSupersetId(ex.supersetId ?? ex.superset_id);
    const systemType = normalizeWorkoutSystemType(ex.workoutSystemType ?? ex.workout_system_type);

    if (supersetId && systemType !== "normal") {
      const groupExercises = exercises.filter(
        (e) =>
          normalizeSupersetId(e.supersetId ?? e.superset_id) === supersetId &&
          normalizeWorkoutSystemType(e.workoutSystemType ?? e.workout_system_type) === systemType
      );
      groupExercises.forEach((e) => processed.add(e.uid ?? e.key));
      groups.push({
        kind: "group",
        supersetId,
        workoutSystemType: systemType,
        exercises: groupExercises,
      });
    } else {
      processed.add(trackId);
      groups.push({ kind: "single", exercises: [ex] });
    }
  }

  return groups;
}

export function isExerciseLinked(ex) {
  const supersetId = normalizeSupersetId(ex?.supersetId ?? ex?.superset_id);
  const systemType = normalizeWorkoutSystemType(ex?.workoutSystemType ?? ex?.workout_system_type);
  return Boolean(supersetId && systemType !== "normal");
}

export function exerciseEntryFromApi(ex) {
  const sets = ex.sets != null ? String(ex.sets) : "";
  const reps = ex.reps || "";
  let setsDetails = normalizeSetsDetails(ex.setsDetails ?? ex.sets_details);

  if (!setsDetails.length) {
    const setsNum = parseInt(sets, 10) || 0;
    if (setsNum > 0) {
      setsDetails = createSetsDetails(setsNum, reps);
    }
  }

  return {
    exerciseId: ex.exerciseId,
    name: ex.name,
    sets: setsDetails.length ? String(setsDetails.length) : sets,
    reps: summarizeSetReps(setsDetails) || reps,
    setsDetails,
    imageUrl: ex.imageUrl || "",
    supersetId: normalizeSupersetId(ex.supersetId ?? ex.superset_id),
    workoutSystemType: normalizeWorkoutSystemType(
      ex.workoutSystemType ?? ex.workout_system_type
    ),
  };
}

export function formatExerciseEntry({ name, sets, reps, setsDetails }) {
  const parts = [name];
  const details = normalizeSetsDetails(setsDetails);
  const setsNum = details.length || parseInt(sets, 10);
  if (setsNum > 0) parts.push(`${setsNum} ست`);
  const repsLabel = details.length ? summarizeSetReps(details) : String(reps || "").trim();
  if (repsLabel) parts.push(`${repsLabel} تکرار`);
  return parts.join(" — ");
}

export function parseExerciseStep(step) {
  const text = String(step || "").trim();
  if (!text) return { name: "", sets: "", reps: "", setsDetails: [], supersetId: null, workoutSystemType: "normal" };

  const parts = text.split(" — ").map((p) => p.trim());
  const name = parts[0] || "";
  let sets = "";
  let reps = "";

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p.includes("ست")) {
      sets = p.replace(/ست/g, "").trim();
    } else if (p.includes("تکرار")) {
      reps = p.replace(/تکرار/g, "").trim();
    }
  }

  const setsNum = parseInt(sets, 10) || 0;
  const setsDetails = setsNum > 0 ? createSetsDetails(setsNum, reps) : [];

  return { name, sets, reps, setsDetails, supersetId: null, workoutSystemType: "normal" };
}

export function emptyDayExercises() {
  const map = {};
  for (const key of ["sat", "sun", "mon", "tue", "wed", "thu", "fri"]) {
    map[key] = [];
  }
  return map;
}

export function dayExercisesToPlanByDay(dayExercises) {
  const planByDay = {};
  for (const [key, list] of Object.entries(dayExercises)) {
    planByDay[key] = {
      workout: {
        title: "",
        steps: list.map((e) => formatExerciseEntry(e)),
        exercises: list.map((e) => {
          let setsDetails = normalizeSetsDetails(e.setsDetails);
          const setsNum = parseInt(e.sets, 10) || 0;
          if (!setsDetails.length && setsNum > 0) {
            setsDetails = createSetsDetails(setsNum, e.reps);
          }

          return {
            exerciseId: e.exerciseId ? Number(e.exerciseId) : undefined,
            name: e.name,
            sets: setsDetails.length || setsNum,
            reps: summarizeSetReps(setsDetails) || String(e.reps || "").trim(),
            setsDetails: setsDetails.map((s, i) => ({
              setNumber: s.setNumber || i + 1,
              reps: s.isAmrap ? "" : String(s.reps || "").trim(),
              isAmrap: Boolean(s.isAmrap),
            })),
            imageUrl: e.imageUrl || "",
            supersetId: normalizeSupersetId(e.supersetId ?? e.superset_id),
            workoutSystemType: normalizeWorkoutSystemType(
              e.workoutSystemType ?? e.workout_system_type
            ),
          };
        }),
      },
      nutrition: { caloriesTarget: 0, proteinTarget: "", meals: [] },
    };
  }
  return planByDay;
}

export function planByDayToDayExercises(planByDay) {
  const map = emptyDayExercises();
  if (!planByDay) return map;
  for (const key of Object.keys(map)) {
    const workout = planByDay[key]?.workout;
    const exercises = workout?.exercises;
    if (exercises?.length) {
      map[key] = exercises.map((ex, i) => ({
        uid: `${key}-${i}-${ex.exerciseId || ex.name}`,
        ...exerciseEntryFromApi(ex),
      }));
      continue;
    }
    const steps = workout?.steps || [];
    map[key] = steps.map((step, i) => {
      const parsed = parseExerciseStep(step);
      return {
        uid: `${key}-${i}-${Date.now()}`,
        ...parsed,
        imageUrl: "",
      };
    });
  }
  return map;
}

export function newExerciseEntry({ exerciseId, name, imageUrl = "", sets = "3", reps = "12" }) {
  const setsDetails = createSetsDetails(sets, reps);
  return {
    exerciseId,
    name,
    imageUrl,
    sets: String(setsDetails.length || sets),
    reps: summarizeSetReps(setsDetails) || String(reps || "").trim(),
    setsDetails,
    supersetId: null,
    workoutSystemType: "normal",
  };
}
