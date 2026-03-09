import { PROFILES_COLLECTION } from "./auth-context";
import { firestoreService } from "./firestore.service";

export type ProfileRecord = {
  id: string;
  email: string;
  displayName: string;
  roleIds: string[];
};

type ProfileDoc = {
  email: string;
  displayName: string;
  roleIds: string[];
};

function toProfileRecord(id: string, data: ProfileDoc): ProfileRecord {
  return {
    id,
    email: data.email ?? "",
    displayName: data.displayName ?? "",
    roleIds: data.roleIds ?? [],
  };
}

export async function getProfiles(): Promise<{
  items: ProfileRecord[];
  last: null;
}> {
  const rows = await firestoreService.getDocuments<ProfileDoc>(
    PROFILES_COLLECTION,
    200
  );
  const items = rows.map((r) => toProfileRecord(r.id, r.data));
  items.sort((a, b) =>
    (a.displayName || a.email).localeCompare(b.displayName || b.email)
  );
  return { items, last: null };
}

export async function saveProfile(
  id: string,
  data: Omit<ProfileRecord, "id">
): Promise<void> {
  await firestoreService.updateDocument(PROFILES_COLLECTION, id, {
    email: data.email,
    displayName: data.displayName,
    roleIds: data.roleIds,
  });
}

export async function deleteProfile(id: string): Promise<void> {
  await firestoreService.deleteDocument(PROFILES_COLLECTION, id);
}
