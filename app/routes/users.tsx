import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteProfile,
  getProfiles,
  saveProfile,
  type ProfileRecord,
} from "~/lib/firestore-users";
import type { Route } from "./+types/users";
import { DpContent, DpContentHeader } from "~/components/DpContent";
import {
  DpTable,
  type DpTableRef,
  type DpTableDefColumn,
} from "~/components/DpTable";
import { useDataLoader } from "~/lib/use-data-loader";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Usuarios" },
    { name: "description", content: "Mantenimiento de usuarios" },
  ];
}

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "displayName", order: 1, display: true, filter: true },
  { header: "Correo",  column: "email",       order: 2, display: true, filter: true },
  { header: "Roles",   column: "roleIds",     order: 3, display: true, filter: false },
];

export default function Users() {
  const tableRef = useRef<DpTableRef<ProfileRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [editing, setEditing] = useState<ProfileRecord | null>(null);

  const withLoader = useDataLoader();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    await withLoader(async () => {
      try {
        const { items } = await getProfiles();
        tableRef.current?.setDatasource(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
        tableRef.current?.clearDatasource();
      } finally {
        setLoading(false);
        tableRef.current?.setLoading(false);
      }
    });
  }, [withLoader]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const handleDeleteSelected = async () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar ${selected.length} usuario(s)?`)) return;
    try {
      await Promise.all(selected.map((u) => deleteProfile(u.id)));
      tableRef.current?.clearSelectedRows();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  const handleEdit = (user: ProfileRecord) => {
    setEditing({ ...user });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await saveProfile(editing.id, {
        email: editing.email,
        displayName: editing.displayName,
        roleIds: editing.roleIds,
      });
      setEditing(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    }
  };

  return (
    <DpContent title="USUARIOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={fetchUsers}
        onDelete={handleDeleteSelected}
        deleteDisabled={selectedCount === 0 || loading}
        loading={loading}
        filterPlaceholder="Filtrar por nombre o correo..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ProfileRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="displayName"
        onDetail={handleEdit}
        onEdit={handleEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre o correo..."
        emptyMessage='No hay usuarios en la colección.'
        emptyFilterMessage="No hay resultados para el filtro."
      />

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-semibold">Editar usuario</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                value={editing.displayName}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, displayName: e.target.value } : null
                  )
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input
                type="email"
                value={editing.email}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, email: e.target.value } : null
                  )
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </DpContent>
  );
}
