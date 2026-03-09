import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getModule, saveModule } from "~/lib/firestore-modules";
import type { ModuleRecord, ModulePermission, ModuleColumn } from "~/lib/firestore-modules";
import type { Route } from "./+types/modules.$id";
import { DpContentInfo, DpContentHeader } from "~/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "~/components/DpTable";
import SetPermissionDialog from "./modules/SetPermissionDialog";
import SetColumnDialog from "./modules/SetColumnDialog";
import SetModuleDialog from "./modules/SetModuleDialog";
import { useDataLoader } from "~/lib/use-data-loader";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Módulo: ${params.id}` },
    { name: "description", content: `Detalle del módulo ${params.id}` },
  ];
}

interface PermissionRow extends ModulePermission {
  id: string;
}

interface ColumnRow extends ModuleColumn {
  id: string;
}

const PERMISSIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código", column: "code", order: 1, display: true, filter: true },
  { header: "Etiqueta", column: "label", order: 2, display: true, filter: true },
  { header: "Descripción", column: "description", order: 3, display: true, filter: true },
];

const COLUMNS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Orden", column: "order", order: 1, display: true, filter: false },
  { header: "Nombre", column: "name", order: 2, display: true, filter: true },
  { header: "Encabezado", column: "header", order: 3, display: true, filter: true },
  { header: "Filtro", column: "filter", order: 4, display: true, filter: false, type: "bool" },
  { header: "Formato", column: "format", order: 5, display: true, filter: true },
];

export default function ModuleDetail() {
  const navigate = useNavigate();
  const { id: moduleId } = useParams<{ id: string }>();
  const [module, setModule] = useState<ModuleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [permissionFilter, setPermissionFilter] = useState("");
  const [columnFilter, setColumnFilter] = useState("");
  const [selectedPermissionCount, setSelectedPermissionCount] = useState(0);
  const [selectedColumnCount, setSelectedColumnCount] = useState(0);

  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionEditIndex, setPermissionEditIndex] = useState<number | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columnEditIndex, setColumnEditIndex] = useState<number | null>(null);
  const [editModuleOpen, setEditModuleOpen] = useState(false);

  const permissionTableRef = useRef<DpTableRef<PermissionRow>>(null);
  const columnTableRef = useRef<DpTableRef<ColumnRow>>(null);

  const withLoader = useDataLoader();

  const fetchModule = async () => {
    if (!moduleId) return;
    setError(null);
    await withLoader(async () => {
      try {
        const data = await getModule(moduleId);
        setModule(data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar módulo.");
      }
    });
  };

  const fetchModuleWithLoading = async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);
    await withLoader(async () => {
      try {
        const data = await getModule(moduleId);
        setModule(data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar módulo.");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchModuleWithLoading();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  useEffect(() => {
    if (module == null) return;
    const pRows: PermissionRow[] = (Array.isArray(module.permissions) ? module.permissions : []).map(
      (p, i) => ({ id: String(i), code: p?.code ?? "", label: p?.label ?? "", description: p?.description ?? "" })
    );
    const cRows: ColumnRow[] = (Array.isArray(module.columns) ? module.columns : []).map((col, i) => ({
      id: String(i),
      ...col,
    }));
    permissionTableRef.current?.setDatasource(pRows);
    columnTableRef.current?.setDatasource(cRows);
  }, [module]);

  const backToModules = () => navigate("/system/modules");

  const deletePermissions = async () => {
    if (!module || !moduleId) return;
    const selected = permissionTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const indices = new Set(selected.map((r) => parseInt(r.id, 10)));
    const newPermissions = (Array.isArray(module.permissions) ? module.permissions : []).filter(
      (_, i) => !indices.has(i)
    );
    setSaving(true);
    try {
      await saveModule(moduleId, { permissions: newPermissions });
      await fetchModule();
      permissionTableRef.current?.clearSelectedRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteColumns = async () => {
    if (!module || !moduleId) return;
    const selected = columnTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const indices = new Set(selected.map((r) => parseInt(r.id, 10)));
    const newColumns = module.columns.filter((_, i) => !indices.has(i));
    setSaving(true);
    try {
      await saveModule(moduleId, { columns: newColumns });
      await fetchModule();
      columnTableRef.current?.clearSelectedRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionFilter = (value: string) => {
    setPermissionFilter(value);
    permissionTableRef.current?.filter(value);
  };

  const handleColumnFilter = (value: string) => {
    setColumnFilter(value);
    columnTableRef.current?.filter(value);
  };

  if (!moduleId) {
    return (
      <DpContentInfo title="MÓDULO" backLabel="Volver a módulos" onBack={backToModules}>
        <p className="text-zinc-500">ID de módulo no válido.</p>
      </DpContentInfo>
    );
  }

  if (loading && !module) {
    return (
      <DpContentInfo title="MÓDULO" backLabel="Volver a módulos" onBack={backToModules}>
        <p className="text-zinc-500">Cargando…</p>
      </DpContentInfo>
    );
  }

  if (!module) {
    return (
      <DpContentInfo title="MÓDULO" backLabel="Volver a módulos" onBack={backToModules}>
        <p className="text-zinc-500">Módulo no encontrado.</p>
      </DpContentInfo>
    );
  }

  return (
    <DpContentInfo
      title={module.description || module.id}
      backLabel="Volver a módulos"
      onBack={backToModules}
      editLabel="Editar módulo"
      onEdit={() => setEditModuleOpen(true)}
    >
      <div className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Permisos */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Permisos</h2>
          <DpContentHeader
            filterValue={permissionFilter}
            onFilter={handlePermissionFilter}
            onCreate={() => { setPermissionEditIndex(null); setPermissionDialogOpen(true); }}
            onDelete={deletePermissions}
            deleteDisabled={selectedPermissionCount === 0 || saving}
            filterPlaceholder="Filtrar permisos..."
          />
          <DpTable<PermissionRow>
            ref={permissionTableRef}
            tableDef={PERMISSIONS_TABLE_DEF}
            linkColumn="code"
            onDetail={(row) => { setPermissionEditIndex(parseInt(row.id, 10)); setPermissionDialogOpen(true); }}
            onEdit={(row) => { setPermissionEditIndex(parseInt(row.id, 10)); setPermissionDialogOpen(true); }}
            onSelectionChange={(rows) => setSelectedPermissionCount(rows.length)}
            showFilterInHeader={false}
            emptyMessage="No hay permisos. Agregar para definir."
            emptyFilterMessage="No hay resultados."
          />
        </section>

        {/* Columnas */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Columnas</h2>
          <DpContentHeader
            filterValue={columnFilter}
            onFilter={handleColumnFilter}
            onCreate={() => { setColumnEditIndex(null); setColumnDialogOpen(true); }}
            onDelete={deleteColumns}
            deleteDisabled={selectedColumnCount === 0 || saving}
            filterPlaceholder="Filtrar columnas..."
          />
          <DpTable<ColumnRow>
            ref={columnTableRef}
            tableDef={COLUMNS_TABLE_DEF}
            linkColumn="name"
            onDetail={(row) => { setColumnEditIndex(parseInt(row.id, 10)); setColumnDialogOpen(true); }}
            onEdit={(row) => { setColumnEditIndex(parseInt(row.id, 10)); setColumnDialogOpen(true); }}
            onSelectionChange={(rows) => setSelectedColumnCount(rows.length)}
            showFilterInHeader={false}
            emptyMessage="No hay columnas. Agregar para definir."
            emptyFilterMessage="No hay resultados."
          />
        </section>

        <SetPermissionDialog
          visible={permissionDialogOpen}
          moduleId={moduleId}
          permissionIndex={permissionEditIndex}
          currentPermissions={Array.isArray(module.permissions) ? module.permissions : []}
          onSuccess={async () => { setPermissionDialogOpen(false); await fetchModule(); }}
          onHide={() => setPermissionDialogOpen(false)}
        />

        <SetColumnDialog
          visible={columnDialogOpen}
          moduleId={moduleId}
          columnIndex={columnEditIndex}
          currentColumns={Array.isArray(module.columns) ? module.columns : []}
          onSuccess={async () => { setColumnDialogOpen(false); await fetchModule(); }}
          onHide={() => setColumnDialogOpen(false)}
        />

        <SetModuleDialog
          visible={editModuleOpen}
          moduleId={moduleId}
          onSuccess={() => { setEditModuleOpen(false); fetchModule(); }}
          onHide={() => setEditModuleOpen(false)}
        />
      </div>
    </DpContentInfo>
  );
}
