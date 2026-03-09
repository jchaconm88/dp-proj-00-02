import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  serverTimestamp,
  runTransaction,
  where,
} from "firebase/firestore";
import { auth, db } from "~/lib/firebase";
import type { ResetPeriod, SequenceRecord, SequenceAddInput, SequenceEditInput } from "./sequences.types";

const COLLECTION = "sequences";
const COUNTERS_COLLECTION = "counters";

function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

type SequenceDoc = Record<string, unknown>;

function toSequenceRecord(id: string, data: SequenceDoc): SequenceRecord {
  const rp = data.resetPeriod as string;
  const resetPeriod: ResetPeriod =
    rp === "yearly" || rp === "monthly" || rp === "daily" ? rp : "never";
  return {
    id,
    entity: String(data.entity ?? ""),
    prefix: String(data.prefix ?? ""),
    digits: Number(data.digits) || 6,
    format: String(data.format ?? "{prefix}-{number}"),
    resetPeriod,
    allowManualOverride: data.allowManualOverride === true,
    preventGaps: data.preventGaps === true,
    active: data.active !== false,
  };
}

export async function getSequenceById(id: string): Promise<SequenceRecord | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toSequenceRecord(snap.id, snap.data() as SequenceDoc);
}

export async function getSequences(): Promise<{ items: SequenceRecord[]; last: null }> {
  const q = query(collection(db, COLLECTION), limit(200));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => toSequenceRecord(d.id, d.data() as SequenceDoc));
  items.sort((a, b) => a.entity.localeCompare(b.entity));
  return { items, last: null };
}

export async function getActiveSequenceByEntity(entity: string): Promise<SequenceRecord | null> {
  const q = query(collection(db, COLLECTION), where("entity", "==", entity), limit(10));
  const snap = await getDocs(q);
  const found = snap.docs.find((d) => d.data().active !== false);
  return found ? toSequenceRecord(found.id, found.data() as SequenceDoc) : null;
}

export async function addSequence(data: SequenceAddInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    entity: data.entity.trim(),
    prefix: (data.prefix ?? "").trim(),
    digits: Number(data.digits) || 6,
    format: (data.format ?? "{prefix}-{number}").trim(),
    resetPeriod: data.resetPeriod ?? "yearly",
    allowManualOverride: !!data.allowManualOverride,
    preventGaps: !!data.preventGaps,
    active: data.active !== false,
    createBy: getCurrentUserEmail() ?? undefined,
    createAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSequence(id: string, data: SequenceEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.entity !== undefined) payload.entity = data.entity.trim();
  if (data.prefix !== undefined) payload.prefix = data.prefix.trim();
  if (data.digits !== undefined) payload.digits = Number(data.digits) || 6;
  if (data.format !== undefined) payload.format = data.format.trim();
  if (data.resetPeriod !== undefined) payload.resetPeriod = data.resetPeriod;
  if (data.allowManualOverride !== undefined) payload.allowManualOverride = data.allowManualOverride;
  if (data.preventGaps !== undefined) payload.preventGaps = data.preventGaps;
  if (data.active !== undefined) payload.active = data.active;
  payload.updateBy = getCurrentUserEmail() ?? undefined;
  payload.updateAt = serverTimestamp();
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteSequence(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ── Utilidades de numeración ───────────────────────────────────────────────

export function makeCounterId(sequenceId: string, period: string): string {
  const safe = String(period ?? "").replace(/\//g, "-").trim() || "all";
  return `${sequenceId}_${safe}`;
}

export function getCurrentPeriod(resetPeriod: ResetPeriod): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  switch (resetPeriod) {
    case "yearly":  return String(y);
    case "monthly": return `${y}-${m}`;
    case "daily":   return `${y}-${m}-${d}`;
    default:        return "all";
  }
}

/**
 * Genera el siguiente número para la entidad según la secuencia configurada.
 * Usa una transacción para evitar condiciones de carrera por concurrencia.
 */
export async function generateNumber(entity: string): Promise<string> {
  const sequence = await getActiveSequenceByEntity(entity);
  if (!sequence) {
    throw new Error(`No existe una secuencia activa para la entidad "${entity}".`);
  }

  const period = getCurrentPeriod(sequence.resetPeriod);
  const counterId = makeCounterId(sequence.id, period);

  const nextNumber = await runTransaction(db, async (transaction) => {
    const ref = doc(db, COUNTERS_COLLECTION, counterId);
    const snap = await transaction.get(ref);
    let next: number;
    if (!snap.exists()) {
      next = 1;
      transaction.set(ref, {
        sequenceId: sequence.id,
        sequence: `${sequence.entity} (${sequence.prefix})`.trim(),
        period,
        lastNumber: 1,
        active: true,
      });
    } else {
      const last = Number(snap.data()?.lastNumber ?? 0) || 0;
      next = last + 1;
      transaction.update(ref, { lastNumber: next });
    }
    return next;
  });

  const year  = String(new Date().getFullYear());
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const day   = String(new Date().getDate()).padStart(2, "0");
  const digits = Math.max(0, Number(sequence.digits) || 6);
  const numberStr = String(nextNumber).padStart(digits, "0");

  return String(sequence.format ?? "{prefix}-{number}")
    .replace(/\{prefix\}/gi, sequence.prefix ?? "")
    .replace(/\{year\}/gi,   year)
    .replace(/\{month\}/gi,  month)
    .replace(/\{day\}/gi,    day)
    .replace(/\{number\}/gi, numberStr);
}

/**
 * Devuelve el código a guardar: si currentCode tiene valor lo devuelve;
 * si está vacío genera el siguiente con generateNumber(entity).
 */
export async function resolveCodeIfEmpty(currentCode: string, entity: string): Promise<string> {
  const trimmed = String(currentCode ?? "").trim();
  if (trimmed) return trimmed;
  return generateNumber(entity);
}
