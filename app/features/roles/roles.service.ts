import { ROLES_COLLECTION } from "~/lib/auth-context";
import { firestoreService } from "~/lib/firestore.service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "~/lib/firebase";
import type { RoleRecord, RolePermissions } from "./roles.types";

type RoleDoc = {
  name?: string;
  description?: string;
  permissions?: unknown;
  permission?: string[];
  createBy?: string;
  createAt?: unknown;
  updateBy?: string;
  updateAt?: unknown;
};

function normalizePermissions(raw: unknown): RolePermissions {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: RolePermissions = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== "string") continue;
    if (Array.isArray(value)) {
      out[key] = value.filter((c): c is string => typeof c === "string");
    }
  }
  return out;
}

function toRoleRecord(id: string, data: RoleDoc): RoleRecord {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    permissions: normalizePermissions(data.permissions),
    permission: Array.isArray(data.permission) ? data.permission : [],
    createBy: data.createBy,
    createAt: data.createAt,
    updateBy: data.updateBy,
    updateAt: data.updateAt,
  };
}

/** Obtiene un rol por ID. */
export async function getRoleById(id: string): Promise<RoleRecord | null> {
  const snap = await getDoc(doc(db, ROLES_COLLECTION, id));
  if (!snap.exists()) return null;
  return toRoleRecord(snap.id, snap.data() as RoleDoc);
}

export async function getRoles(opts?: {
  pageSize?: number;
  last?: unknown;
}): Promise<{ items: RoleRecord[]; last: null }> {
  const rows = await firestoreService.getDocuments<RoleDoc>(ROLES_COLLECTION, opts?.pageSize ?? 200);
  const items = rows.map((r) => toRoleRecord(r.id, r.data));
  items.sort((a, b) => a.name.localeCompare(b.name));
  return { items, last: null };
}

/** Obtiene todos los roles para resolver permisos del usuario. */
export async function getAllRoles(): Promise<RoleRecord[]> {
  const rows = await firestoreService.getDocuments<RoleDoc>(ROLES_COLLECTION, 100);
  const items = rows.map((r) => toRoleRecord(r.id, r.data));
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

/** Crea un rol nuevo. */
export async function addRole(data: { name: string; description: string | null }): Promise<string> {
  return firestoreService.addDocument(ROLES_COLLECTION, {
    name: data.name,
    description: data.description ?? "",
    permissions: {},
  });
}

/** Actualiza campos parciales de un rol. */
export async function updateRole(id: string, data: Partial<Omit<RoleRecord, "id">>): Promise<void> {
  await firestoreService.updateDocument(ROLES_COLLECTION, id, data);
}

/** @deprecated Usar addRole/updateRole */
export async function saveRole(id: string, data: Omit<RoleRecord, "id">): Promise<string> {
  const payload = {
    name: data.name,
    description: data.description,
    permissions: data.permissions ?? {},
  };
  if (!id) return firestoreService.addDocument(ROLES_COLLECTION, payload);
  await firestoreService.updateDocument(ROLES_COLLECTION, id, payload);
  return id;
}

export async function deleteRole(id: string): Promise<void> {
  await firestoreService.deleteDocument(ROLES_COLLECTION, id);
}
