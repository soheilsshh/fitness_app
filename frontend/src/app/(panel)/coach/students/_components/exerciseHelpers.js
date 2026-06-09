export function formatExerciseEntry({ name, sets, reps }) {
  const parts = [name];
  const setsNum = parseInt(sets, 10);
  if (setsNum > 0) parts.push(`${setsNum} ست`);
  if (reps && String(reps).trim()) parts.push(`${String(reps).trim()} تکرار`);
  return parts.join(" — ");
}

export function parseExerciseStep(step) {
  const text = String(step || "").trim();
  if (!text) return { name: "", sets: "", reps: "" };

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

  return { name, sets, reps };
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
    const steps = planByDay[key]?.workout?.steps || [];
    map[key] = steps.map((step, i) => ({
      uid: `${key}-${i}-${Date.now()}`,
      ...parseExerciseStep(step),
      imageUrl: "",
    }));
  }
  return map;
}
