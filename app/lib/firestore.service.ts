import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore,
  type Unsubscribe,
  onSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type AuditFields = {
  createBy?: string;
  createAt?: unknown;
  updateBy?: string;
  updateAt?: unknown;
};

function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email ?? null;
}

/**
 * Servicio central para operaciones Firestore.
 * Añade createBy/createAt al alta y updateBy/updateAt en modificaciones.
 */
export const firestoreService = {
  getCurrentUserEmail,

  /**
   * Alta: añade createBy (email del usuario) y createAt (timestamp del servidor).
   */
  async addDocument<T extends DocumentData>(
    collectionPath: string,
    data: Omit<T, "createBy" | "createAt" | "updateBy" | "updateAt">
  ): Promise<string> {
    const payload = {
      ...data,
      createBy: getCurrentUserEmail() ?? undefined,
      createAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, collectionPath), payload);
    return ref.id;
  },

  /**
   * Modificación: añade updateBy y updateAt. No sobrescribe createBy/createAt.
   */
  async updateDocument<T extends DocumentData>(
    collectionPath: string,
    documentId: string,
    data: Partial<Omit<T, "createBy" | "createAt" | "updateBy" | "updateAt">>
  ): Promise<void> {
    const payload = {
      ...data,
      updateBy: getCurrentUserEmail() ?? undefined,
      updateAt: serverTimestamp(),
    };
    await updateDoc(doc(db, collectionPath, documentId), payload as DocumentData);
  },

  /**
   * Reemplaza el documento (setDoc). Para altas con ID conocido.
   * Si isNew === true, añade createBy/createAt; si no, updateBy/updateAt.
   */
  async setDocument<T extends DocumentData>(
    collectionPath: string,
    documentId: string,
    data: T,
    isNew: boolean
  ): Promise<void> {
    const email = getCurrentUserEmail();
    const payload = isNew
      ? { ...data, createBy: email ?? undefined, createAt: serverTimestamp() }
      : {
          ...data,
          updateBy: email ?? undefined,
          updateAt: serverTimestamp(),
        };
    await setDoc(doc(db, collectionPath, documentId), payload as DocumentData);
  },

  async deleteDocument(collectionPath: string, documentId: string): Promise<void> {
    await deleteDoc(doc(db, collectionPath, documentId));
  },

  /**
   * Obtiene documentos de una colección (sin orderBy para evitar índices).
   */
  async getDocuments<T>(
    collectionPath: string,
    maxItems: number = 200,
    ...constraints: QueryConstraint[]
  ): Promise<{ id: string; data: T }[]> {
    const q = query(
      collection(db, collectionPath),
      limit(maxItems),
      ...constraints
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
  },

  /**
   * Suscripción en tiempo real a una colección.
   */
  subscribeCollection<T>(
    collectionPath: string,
    callback: (items: { id: string; data: T }[]) => void,
    maxItems: number = 200,
    ...constraints: QueryConstraint[]
  ): Unsubscribe {
    const q = query(
      collection(db, collectionPath),
      limit(maxItems),
      ...constraints
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, data: d.data() as T }));
      callback(items);
    });
  },

  /**
   * Suscripción en tiempo real a un documento.
   */
  subscribeDocument<T>(
    collectionPath: string,
    documentId: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, collectionPath, documentId), (snap) => {
      callback(snap.exists() ? (snap.data() as T) : null);
    });
  },
};
