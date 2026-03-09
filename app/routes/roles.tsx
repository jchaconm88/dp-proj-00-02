import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getRoles, deleteRole, type RoleRecord } from "~/lib/firestore-roles";
import type { Route } from "./+types/roles";
import { DpContent, DpContentHeader } from "~/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "~/components/DpTable";
import SetRoleDialog from "./roles/SetRoleDialog";
import { useDataLoader } from "~/lib/use-data-loader";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Roles" },
    { name: "description", content: "Mantenimiento de roles" },
  ];
}

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Nombre", column: "name", order: 1, display: true, filter: true },
  { header: "Descripción", column: "description", order: 2, display: true, filter: true },
];

export default function Roles() {
  const navigate = useNavigate();
  const tableRef = useRef<DpTableRef<RoleRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const withLoader = useDataLoader();

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    await withLoader(async () => {
      try {
        const { items } = await getRoles();
        tableRef.current?.setDatasource(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar roles.");
        tableRef.current?.clearDatasource();
      } finally {
        setLoading(false);
        tableRef.current?.setLoading(false);
      }
    });
  }, [withLoader]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => {
    setEditingId(null);
    setDialogVisible(true);
  };

  const openEdit = (role: RoleRecord) => {
    setEditingId(role.id);
    setDialogVisible(true);
  };

  const openInfo = (role: RoleRecord) => {
    navigate("/system/roles/" + encodeURIComponent(role.id));
  };

  const handleDeleteSelected = async () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar ${selected.length} rol(es)?`)) return;
    setSaving(true);
    try {
      await Promise.all(selected.map((r) => deleteRole(r.id)));
      tableRef.current?.clearSelectedRows();
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContent title="ROLES">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={fetchRoles}
        onCreate={openAdd}
        onDelete={handleDeleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por nombre o descripción..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<RoleRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="name"
        onDetail={openInfo}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por nombre o descripción..."
        emptyMessage='No hay roles en la colección "roles".'
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetRoleDialog
        visible={dialogVisible}
        roleId={editingId}
        onSuccess={() => {
          setDialogVisible(false);
          fetchRoles();
        }}
        onHide={() => setDialogVisible(false)}
      />
    </DpContent>
  );
}
