export type CoreMode = '3CORE_4_5' | '4CORE_6' | '4CORE_4';

export interface Profession {
  id: string;
  name: string;
  category: string;
  iconUrl?: string;
  sortOrder: number;
  active: boolean;
}

export interface Skill {
  id: string;
  professionId: string;
  name: string;
  iconUrl?: string;
  sortOrder: number;
  active: boolean;
  recommended: boolean;
}

export interface BoostCore {
  mainSkillId: string;
  subSkillIds: [string, string];
}

export interface PerfectCoreRequest {
  mode: CoreMode;
  selectedSkillIds: string[];
  halfSkillId?: string;
}

export interface PerfectCoreResult {
  cores: BoostCore[];
  skillCounts: Record<string, number>;
  skillLevels: Record<string, number>;
}

export interface CoreCalculationOutput {
  results: PerfectCoreResult[];
  error?: string;
}
