import type {
  BoostCore,
  CoreCalculationOutput,
  PerfectCoreRequest,
  PerfectCoreResult,
} from "./perfectCoreTypes";

export interface NextCoreRecommendation {
  core: BoostCore;
  planCount: number;
}

export function getCoreKey(core: BoostCore): string {
  const [a, b] = [...core.subSkillIds].sort();
  return `${core.mainSkillId}|${a}|${b}`;
}

export function getCombinationKey(cores: BoostCore[]): string {
  return cores.map(getCoreKey).sort().join("#");
}

export function recommendNextCores(
  results: PerfectCoreResult[],
  ownedCores: BoostCore[],
): NextCoreRecommendation[] {
  const ownedKeys = new Set(ownedCores.map(getCoreKey));
  const candidates = new Map<string, NextCoreRecommendation>();
  results
    .filter(
      (result) =>
        ownedKeys.size === 0 ||
        [...ownedKeys].every((key) =>
          result.cores.some((core) => getCoreKey(core) === key),
        ),
    )
    .forEach((result) => {
      result.cores.forEach((core) => {
        const key = getCoreKey(core);
        if (ownedKeys.has(key)) return;
        const current = candidates.get(key);
        candidates.set(key, { core, planCount: (current?.planCount ?? 0) + 1 });
      });
    });
  return [...candidates.values()].sort(
    (a, b) =>
      b.planCount - a.planCount ||
      getCoreKey(a.core).localeCompare(getCoreKey(b.core)),
  );
}

function buildTargetCounts(
  request: PerfectCoreRequest,
): Record<string, number> | string {
  const required =
    request.mode === "4CORE_6" ? 6 : request.mode === "4CORE_4" ? 4 : 5;
  if (request.selectedSkillIds.length !== required) {
    return `${request.mode === "4CORE_6" ? "4核6" : request.mode === "4CORE_4" ? "4核4" : "3核4.5"}必须选择 ${required} 个技能`;
  }
  if (request.mode === "3CORE_4_5" && !request.halfSkillId)
    return "请选择一个半强化技能";
  if (
    request.halfSkillId &&
    !request.selectedSkillIds.includes(request.halfSkillId)
  )
    return "半强化技能必须属于已选择的技能";

  return Object.fromEntries(
    request.selectedSkillIds.map((id) => [
      id,
      request.mode === "3CORE_4_5" && id === request.halfSkillId
        ? 1
        : request.mode === "4CORE_4"
          ? 3
          : 2,
    ]),
  );
}

export function calculatePerfectCores(
  request: PerfectCoreRequest,
): CoreCalculationOutput {
  const targetCounts = buildTargetCounts(request);
  if (typeof targetCounts === "string")
    return { results: [], error: targetCounts };
  const target = targetCounts;

  const skills = Object.keys(target);
  const coreByMain = new Map<string, BoostCore[]>();
  for (const main of skills) {
    const cores: BoostCore[] = [];
    const others = skills.filter((skill) => skill !== main);
    for (let i = 0; i < others.length; i += 1) {
      for (let j = i + 1; j < others.length; j += 1) {
        cores.push({
          mainSkillId: main,
          subSkillIds: [others[i], others[j]].sort() as [string, string],
        });
      }
    }
    coreByMain.set(main, cores);
  }

  const coreCount = request.mode === "3CORE_4_5" ? 3 : 4;
  const results: PerfectCoreResult[] = [];
  const seen = new Set<string>();

  function search(
    selected: BoostCore[],
    remaining: Record<string, number>,
    usedMains: Set<string>,
  ) {
    if (selected.length === coreCount) {
      if (Object.values(remaining).some((count) => count !== 0)) return;
      const combinationKey = getCombinationKey(selected);
      if (seen.has(combinationKey)) return;
      seen.add(combinationKey);
      const skillCounts = Object.fromEntries(
        skills.map((id) => [id, target[id]]),
      );
      results.push({
        cores: [...selected].sort((a, b) =>
          getCoreKey(a).localeCompare(getCoreKey(b)),
        ),
        skillCounts,
        // 4核4会让每个技能出现 3 次，但有效强化仍按当前工具规则封顶 50 级。
        skillLevels: Object.fromEntries(
          skills.map((id) => [id, Math.min(target[id] * 25, 50)]),
        ),
      });
      return;
    }

    const candidateMains = skills.filter((skill) => !usedMains.has(skill));
    for (const main of candidateMains) {
      for (const core of coreByMain.get(main) ?? []) {
        const ids = [core.mainSkillId, ...core.subSkillIds];
        const nextRemaining = { ...remaining };
        let valid = true;
        for (const id of ids) {
          nextRemaining[id] -= 1;
          if (nextRemaining[id] < 0) valid = false;
        }
        if (valid) {
          usedMains.add(main);
          search([...selected, core], nextRemaining, usedMains);
          usedMains.delete(main);
        }
      }
    }
  }

  search([], { ...target }, new Set());
  return { results };
}
