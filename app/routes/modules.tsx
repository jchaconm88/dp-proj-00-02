import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getModules, deleteModule } from "~/lib/firestore-modules";
import type { ModuleRecord } from "~/lib/firestore-modules";
import type { Route } from "./+types/modules";
import { DpContent, DpContentHeader } from "~/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "~/components/DpTable";
import SetModuleDialog from "./modules/SetModuleDialog";
import { useDataLoader } from "~/lib/use-data-loader";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Módulos" },
    { name: "description", content: "Mantenimiento de módulos del sistema" },
  ];
}

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Colección", column: "id", order: 1, display: true, filter: true },
  { header: "Descripción", column: "description", order: 2, display: true, filter: true },
];

export default function Modules() {
  const navigate = useNavigate();
  const tableRef = useRef<DpTableRef<ModuleRecord>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [filterValue, setFilterValue] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const withLoader = useDataLoader();

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError(null);
    tableRef.current?.setLoading(true);
    await withLoader(async () => {
      try {
        const { items } = await getModules();
        tableRef.current?.setDatasource(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar módulos.");
        tableRef.current?.clearDatasource();
      } finally {
        setLoading(false);
        tableRef.current?.setLoading(false);
      }
    });
  }, [withLoader]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => {
    setEditingId(null);
    setDialogVisible(true);
  };

  const openEdit = (module: ModuleRecord) => {
    setEditingId(module.id);
    setDialogVisible(true);
  };

  const openInfo = (module: ModuleRecord) => {
    navigate("/system/modules/" + encodeURIComponent(module.id));
  };

  const handleDeleteSelected = async () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar ${selected.length} módulo(s)?`)) return;
    setSaving(true);
    try {
      await Promise.all(selected.map((m) => deleteModule(m.id)));
      tableRef.current?.clearSelectedRows();
      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DpContent title="MÓDULOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={fetchModules}
        onCreate={openAdd}
        onDelete={handleDeleteSelected}
        deleteDisabled={selectedCount === 0 || saving}
        loading={loading}
        filterPlaceholder="Filtrar por colección o descripción..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<ModuleRecord>
        ref={tableRef}
        tableDef={TABLE_DEF}
        linkColumn="id"
        onDetail={openInfo}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        filterPlaceholder="Filtrar por colección o descripción..."
        emptyMessage='No hay módulos en la colección "modules".'
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetModuleDialog
        visible={dialogVisible}
        moduleId={editingId}
        onSuccess={(id) => {
          setDialogVisible(false);
          if (!editingId) {
            // Si es nuevo, navegar a su detalle
            navigate("/system/modules/" + encodeURIComponent(id));
          } else {
            fetchModules();
          }
        }}
        onHide={() => setDialogVisible(false)}
      />
    </DpContent>
  );
}
