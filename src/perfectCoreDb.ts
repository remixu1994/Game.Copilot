import initSqlJs, { type Database } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { adeleSeedSkills, bishopSeedSkills, iceLightningSeedSkills, nightLordSeedSkills, referenceSeedProfessionIds, seedProfessions, seedSkills, shadowerSeedSkills } from './perfectCoreSeed';
import type { Profession, Skill } from './perfectCoreTypes';
import { assertPerfectCoreAdmin } from './perfectCoreAdmin';

const DB_NAME = 'maple-perfect-core';
const DB_STORE = 'sqlite';
let databasePromise: Promise<Database> | undefined;

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSnapshot(): Promise<Uint8Array | undefined> {
  const store = await openStore();
  return new Promise((resolve, reject) => {
    const request = store.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get('database');
    request.onsuccess = () => resolve(request.result ? new Uint8Array(request.result) : undefined);
    request.onerror = () => reject(request.error);
  });
}

async function writeSnapshot(bytes: Uint8Array): Promise<void> {
  const store = await openStore();
  await new Promise<void>((resolve, reject) => {
    const request = store.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(bytes, 'database');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function createSchema(db: Database) {
  db.run(`CREATE TABLE IF NOT EXISTS professions (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, icon_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1); CREATE TABLE IF NOT EXISTS skills (id TEXT PRIMARY KEY, profession_id TEXT NOT NULL, name TEXT NOT NULL, icon_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, recommended INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  const columns = db.exec("PRAGMA table_info(skills)")[0]?.values.map((row) => row[1]) ?? [];
  if (!columns.includes('recommended')) db.run('ALTER TABLE skills ADD COLUMN recommended INTEGER NOT NULL DEFAULT 0; UPDATE skills SET recommended = CASE WHEN sort_order < 4 THEN 1 ELSE 0 END');
}

function isEmpty(db: Database) {
  return (db.exec('SELECT COUNT(*) AS count FROM professions')[0]?.values[0]?.[0] ?? 0) === 0;
}

function seed(db: Database) {
  const professionStatement = db.prepare('INSERT INTO professions (id, name, category, icon_url, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)');
  seedProfessions.forEach((item) => professionStatement.run([item.id, item.name, item.category, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0]));
  professionStatement.free();
  const skillStatement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  seedSkills.forEach((item) => skillStatement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  skillStatement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('seed_version', '3'); INSERT OR REPLACE INTO app_meta (key, value) VALUES ('profession_catalog_version', '3')");
}

function migrateProfessionCatalog(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'profession_catalog_version'")[0]?.values[0]?.[0];
  if (currentVersion === '3') return false;
  const obsoleteIds = ['adventurer-warrior', 'adventurer-mage', 'adventurer-bowman', 'cygnus-knight'];
  const placeholders = obsoleteIds.map(() => '?').join(',');
  const deleteSkills = db.prepare(`DELETE FROM skills WHERE profession_id IN (${placeholders})`);
  deleteSkills.run(obsoleteIds); deleteSkills.free();
  const deleteProfessions = db.prepare(`DELETE FROM professions WHERE id IN (${placeholders})`);
  deleteProfessions.run(obsoleteIds); deleteProfessions.free();
  const statement = db.prepare('INSERT OR REPLACE INTO professions (id, name, category, icon_url, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)');
  seedProfessions.forEach((item) => statement.run([item.id, item.name, item.category, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('profession_catalog_version', '3')");
  return true;
}

function migrateNightLordSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'night_lord_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '1') return false;
  db.run("DELETE FROM skills WHERE profession_id = 'night-lord'");
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  nightLordSeedSkills.forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('night_lord_seed_version', '1')");
  return true;
}

function migrateAdeleSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'adele_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '1') return false;
  db.run("DELETE FROM skills WHERE profession_id = 'adele'");
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  adeleSeedSkills.forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('adele_seed_version', '1')");
  return true;
}

function migrateBishopSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'bishop_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '1') return false;
  db.run("DELETE FROM skills WHERE profession_id = 'bishop'");
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  bishopSeedSkills.forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('bishop_seed_version', '1')");
  return true;
}

function migrateIceLightningSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'ice_lightning_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '1') return false;
  db.run("DELETE FROM skills WHERE profession_id = 'ice-lightning'");
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  iceLightningSeedSkills.forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('ice_lightning_seed_version', '1')");
  return true;
}

function migrateShadowerSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'shadower_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '1') return false;
  db.run("DELETE FROM skills WHERE profession_id = 'shadower'");
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  shadowerSeedSkills.forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('shadower_seed_version', '1')");
  return true;
}

function migrateReferenceSkills(db: Database): boolean {
  const currentVersion = db.exec("SELECT value FROM app_meta WHERE key = 'reference_skill_seed_version'")[0]?.values[0]?.[0];
  if (currentVersion === '2') return false;
  const placeholders = referenceSeedProfessionIds.map(() => '?').join(',');
  const remove = db.prepare(`DELETE FROM skills WHERE profession_id IN (${placeholders})`);
  remove.run(referenceSeedProfessionIds);
  remove.free();
  const professionIds = new Set(referenceSeedProfessionIds);
  const statement = db.prepare('INSERT INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  seedSkills.filter((item) => professionIds.has(item.professionId)).forEach((item) => statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]));
  statement.free();
  db.run("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('reference_skill_seed_version', '2')");
  return true;
}

async function getDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const snapshot = await readSnapshot();
  const db = snapshot ? new SQL.Database(snapshot) : new SQL.Database();
  createSchema(db);
  let changed = false;
  if (isEmpty(db)) {
    seed(db);
    changed = true;
  }
  if (migrateProfessionCatalog(db)) changed = true;
  if (migrateNightLordSkills(db)) changed = true;
  if (migrateAdeleSkills(db)) changed = true;
  if (migrateBishopSkills(db)) changed = true;
  if (migrateIceLightningSkills(db)) changed = true;
  if (migrateShadowerSkills(db)) changed = true;
  if (migrateReferenceSkills(db)) changed = true;
  if (changed) await writeSnapshot(db.export());
  return db;
}

export function database(): Promise<Database> {
  databasePromise ??= getDatabase();
  return databasePromise;
}

function rows<T>(db: Database, sql: string): T[] {
  const result = db.exec(sql)[0];
  if (!result) return [];
  return result.values.map((values) => Object.fromEntries(result.columns.map((column, index) => [column, values[index]])) as T);
}

export async function loadProfessions(): Promise<Profession[]> {
  return rows<Profession>(await database(), 'SELECT id, name, category, icon_url AS iconUrl, sort_order AS sortOrder, active FROM professions WHERE active = 1 ORDER BY sort_order, name').map((item) => ({ ...item, active: Boolean(item.active) }));
}

export async function loadAllProfessions(): Promise<Profession[]> {
  return rows<Profession>(await database(), 'SELECT id, name, category, icon_url AS iconUrl, sort_order AS sortOrder, active FROM professions ORDER BY sort_order, name').map((item) => ({ ...item, active: Boolean(item.active) }));
}

export async function loadSkills(professionId: string, includeInactive = false): Promise<Skill[]> {
  const db = await database();
  const activeClause = includeInactive ? '' : ' AND active = 1';
  const result = db.exec(`SELECT id, profession_id AS professionId, name, icon_url AS iconUrl, sort_order AS sortOrder, active, recommended FROM skills WHERE profession_id = '${professionId.replaceAll("'", "''")}'${activeClause} ORDER BY recommended DESC, sort_order, name`)[0];
  if (!result) return [];
  return result.values.map((values) => ({ ...Object.fromEntries(result.columns.map((column, index) => [column, values[index]])), active: Boolean(values[result.columns.indexOf('active')]), recommended: Boolean(values[result.columns.indexOf('recommended')]) })) as Skill[];
}

export async function saveProfession(item: Profession): Promise<void> {
  assertPerfectCoreAdmin();
  const db = await database();
  const statement = db.prepare('INSERT OR REPLACE INTO professions (id, name, category, icon_url, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)');
  statement.run([item.id, item.name, item.category, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0]); statement.free(); await writeSnapshot(db.export());
}

export async function saveSkill(item: Skill): Promise<void> {
  assertPerfectCoreAdmin();
  const db = await database();
  const statement = db.prepare('INSERT OR REPLACE INTO skills (id, profession_id, name, icon_url, sort_order, active, recommended) VALUES (?, ?, ?, ?, ?, ?, ?)');
  statement.run([item.id, item.professionId, item.name, item.iconUrl ?? '', item.sortOrder, item.active ? 1 : 0, item.recommended ? 1 : 0]); statement.free(); await writeSnapshot(db.export());
}

export async function deleteProfession(id: string): Promise<void> {
  assertPerfectCoreAdmin();
  const db = await database(); const statement = db.prepare('DELETE FROM skills WHERE profession_id = ?'); statement.run([id]); statement.free(); const profession = db.prepare('DELETE FROM professions WHERE id = ?'); profession.run([id]); profession.free(); await writeSnapshot(db.export());
}

export async function deleteSkill(id: string): Promise<void> {
  assertPerfectCoreAdmin();
  const db = await database(); const statement = db.prepare('DELETE FROM skills WHERE id = ?'); statement.run([id]); statement.free(); await writeSnapshot(db.export());
}

export async function exportDatabase(): Promise<Uint8Array> { assertPerfectCoreAdmin(); return (await database()).export(); }

export async function resetDatabase(): Promise<void> {
  assertPerfectCoreAdmin();
  const db = await database(); db.run('DELETE FROM skills; DELETE FROM professions; DELETE FROM app_meta;'); seed(db); await writeSnapshot(db.export());
}
