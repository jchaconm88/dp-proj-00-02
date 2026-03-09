import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  where,
} from "firebase/firestore";
import { auth, db } from "~/lib/firebase";
import { makeCounterId } from "~/features/sequences/sequences.service";
import type { CounterRecord, CounterAddInput, CounterEditInput } from "./counters.types";

const COLLECTION = "counters";

function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

type CounterDoc = Record<string, unknown>;

function toCounterRecord(id: string, data: CounterDoc): CounterRecord {
  return {
    id,
    sequenceId: String(data.sequenceId ?? ""),
    sequence: String(data.sequence ?? ""),
    period: String(data.period ?? ""),
    lastNumber: Number(data.lastNumber) || 0,
    active: data.active !== false,
  };
}

export async function getCounterById(id: string): Promise<CounterRecord | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toCounterRecord(snap.id, snap.data() as CounterDoc);
}

export async function getCounters(): Promise<{ items: CounterRecord[]; last: null }> {
  const q = query(collection(db, COLLECTION), limit(200));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => toCounterRecord(d.id, d.data() as CounterDoc));
  items.sort((a, b) => a.sequence.localeCompare(b.sequence) || a.period.localeCompare(b.period));
  return { items, last: null };
}

export async function getCountersBySequenceId(sequenceId: string): Promise<CounterRecord[]> {
  const q = query(collection(db, COLLECTION), where("sequenceId", "==", sequenceId), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toCounterRecord(d.id, d.data() as CounterDoc));
}

export async function addCounter(data: CounterAddInput): Promise<string> {
  const id = makeCounterId(data.sequenceId.trim(), data.period.trim());
  await setDoc(doc(db, COLLECTION, id), {
    sequenceId: data.sequenceId.trim(),
    sequence: data.sequence.trim(),
    period: data.period.trim(),
    lastNumber: Number(data.lastNumber) || 0,
    active: data.active !== false,
    createBy: getCurrentUserEmail() ?? undefined,
    createAt: serverTimestamp(),
  });
  return id;
}

export async function updateCounter(id: string, data: CounterEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.sequenceId !== undefined) payload.sequenceId = data.sequenceId;
  if (data.sequence !== undefined) payload.sequence = data.sequence;
  if (data.period !== undefined) payload.period = data.period;
  if (data.lastNumber !== undefined) payload.lastNumber = Number(data.lastNumber) || 0;
  if (data.active !== undefined) payload.active = data.active;
  payload.updateBy = getCurrentUserEmail() ?? undefined;
  payload.updateAt = serverTimestamp();
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteCounter(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
