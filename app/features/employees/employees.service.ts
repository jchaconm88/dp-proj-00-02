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
} from "firebase/firestore";
import { auth, db } from "~/lib/firebase";
import type {
  EmployeeRecord,
  EmployeeAddInput,
  EmployeeEditInput,
  EmployeePayroll,
  EmployeeBenefits,
  EmployeeStatus,
  SalaryType,
} from "./employees.types";

const COLLECTION = "employees";

function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

type EmployeeDoc = Record<string, unknown>;

function toPayroll(v: unknown): EmployeePayroll {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const st = (o.salaryType as string) || "monthly";
    const salaryType: SalaryType = st === "weekly" || st === "daily" ? st : "monthly";
    return {
      salaryType,
      baseSalary: Number(o.baseSalary) || 0,
      currency: String(o.currency ?? "PEN"),
    };
  }
  return { salaryType: "monthly", baseSalary: 0, currency: "PEN" };
}

function toBenefits(v: unknown): EmployeeBenefits {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    return {
      cts: o.cts === true,
      gratification: o.gratification === true,
      vacationDays: Number(o.vacationDays) || 0,
    };
  }
  return { cts: true, gratification: true, vacationDays: 30 };
}

function toStatus(s: string): EmployeeStatus {
  const t = (s || "").toLowerCase();
  if (t === "inactive" || t === "suspended") return t;
  return "active";
}

function toEmployeeRecord(id: string, data: EmployeeDoc): EmployeeRecord {
  return {
    id,
    code: String(data.code ?? ""),
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    documentNo: String(data.documentNo ?? ""),
    documentId: String(data.documentId ?? ""),
    phone: String(data.phone ?? data.phoneNo ?? ""),
    email: String(data.email ?? ""),
    positionId: String(data.positionId ?? ""),
    position: String(data.position ?? ""),
    hireDate: String(data.hireDate ?? ""),
    status: toStatus(data.status as string),
    payroll: toPayroll(data.payroll),
    benefits: toBenefits(data.benefits),
  };
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return toEmployeeRecord(snap.id, snap.data() as EmployeeDoc);
}

export async function getEmployees(): Promise<{ items: EmployeeRecord[]; last: null }> {
  const q = query(collection(db, COLLECTION), limit(200));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => toEmployeeRecord(d.id, d.data() as EmployeeDoc));
  items.sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );
  return { items, last: null };
}

export async function addEmployee(data: EmployeeAddInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    code: data.code.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    documentNo: data.documentNo.trim(),
    documentId: data.documentId.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    positionId: data.positionId.trim(),
    position: data.position.trim(),
    hireDate: data.hireDate.trim() || null,
    status: data.status,
    payroll: {
      salaryType: data.payroll.salaryType,
      baseSalary: Number(data.payroll.baseSalary) || 0,
      currency: (data.payroll.currency ?? "PEN").trim(),
    },
    benefits: {
      cts: data.benefits.cts === true,
      gratification: data.benefits.gratification === true,
      vacationDays: Number(data.benefits.vacationDays) || 0,
    },
    createBy: getCurrentUserEmail() ?? undefined,
    createAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEmployee(id: string, data: EmployeeEditInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.code !== undefined) payload.code = data.code;
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.documentNo !== undefined) payload.documentNo = data.documentNo;
  if (data.documentId !== undefined) payload.documentId = data.documentId;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.positionId !== undefined) payload.positionId = data.positionId;
  if (data.position !== undefined) payload.position = data.position;
  if (data.hireDate !== undefined) payload.hireDate = data.hireDate || null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.payroll !== undefined) {
    payload.payroll = {
      salaryType: data.payroll.salaryType,
      baseSalary: Number(data.payroll.baseSalary) || 0,
      currency: (data.payroll.currency ?? "PEN").trim(),
    };
  }
  if (data.benefits !== undefined) {
    payload.benefits = {
      cts: data.benefits.cts === true,
      gratification: data.benefits.gratification === true,
      vacationDays: Number(data.benefits.vacationDays) || 0,
    };
  }
  payload.updateBy = getCurrentUserEmail() ?? undefined;
  payload.updateAt = serverTimestamp();
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteEmployee(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
