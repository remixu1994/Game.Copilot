export const perfectCoreAdminEnabled = import.meta.env.VITE_PERFECT_CORE_ADMIN === 'true';

export function assertPerfectCoreAdmin(): void {
  if (!perfectCoreAdminEnabled) {
    throw new Error('当前构建不允许维护完美核心数据');
  }
}
