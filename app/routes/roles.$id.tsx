import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Checkbox } from "primereact/checkbox";
import {
  getRoleById,
  updateRole,
  type RoleRecord,
  type RolePermissions,
} from "~/lib/firestore-roles";
import type { Route } from "./+types/roles.$id";
import { DpContentInfo, DpContentHeader } from "~/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "~/components/DpTable";
import SetRoleDialog from "./roles/SetRoleDialog";
import SetRolePermissionDialog from "./roles/SetRolePermissionDialog";
import { useDataLoader } from "~/lib/use-data-loader";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Rol: ${params.id}` },
    { name: "description", content: `Detalle del rol ${params.id}` },
  ];
}

const FULL_ACCESS_MODULE = "*";
const FULL_ACCESS_CODE = "*";

interface PermissionRow {
  id: string;
  moduleId: string;
  permissions: string[];
}

const PERMISSIONS_TABLE_DEF: DpTableDefColumn[] = [
  { header: "Módulo", column: "moduleId", order: 1, display: true, filter: true },
  { header: "Permisos", column: "permissions", order: 2, display: true, filter: true },
];

export default function RoleDetail() {
  const navigate = useNavigate();
  const { id: roleId } = useParams<{ id: string }>();

  const [role, setRole] = useState<RoleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [permissionFilter, setPermissionFilter] = useState("");
  const [selectedPermissionCount, setSelectedPermissionCount] = useState(0);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [permissionEditModuleId, setPermissionEditModuleId] = useState<string | null>(null);
  const [editRoleOpen, setEditRoleOpen] = useState(false);

  const permissionTableRef = useRef<DpTableRef<PermissionRow>>(null);

  const withLoader = useDataLoader();

  const fetchRole = async () => {
    if (!roleId) return;
    setError(null);
    await withLoader(async () => {
      try {
        const data = await getRoleById(roleId);
        setRole(data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar rol.");
      }
    });
  };

  const fetchRoleWithLoading = async () => {
    if (!roleId) return;
    setLoading(true);
    setError(null);
    await withLoader(async () => {
      try {
        const data = await getRoleById(roleId);
        setRole(data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar rol.");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchRoleWithLoading();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  useEffect(() => {
    if (role == null) return;
    const perms = role.permissions ?? {};
    const rows: PermissionRow[] = Object.entries(perms).map(([moduleId, codes]) => ({
      id: moduleId,
      moduleId,
      permissions: Array.isArray(codes) ? codes : [],
    }));
    permissionTableRef.current?.setDatasource(rows);
  }, [role]);

  const backToRoles = () => navigate("/system/roles");

  const deletePermissions = async () => {
    if (!role || !roleId) return;
    const selected = permissionTableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    const toRemove = new Set(selected.map((r) => r.moduleId));
    const newPermissions: RolePermissions = {};
    for (const [moduleId, codes] of Object.entries(role.permissions ?? {})) {
      if (!toRemove.has(moduleId)) newPermissions[moduleId] = codes;
    }
    setSaving(true);
    try {
      await updateRole(roleId, { permissions: newPermissions });
      await fetchRole();
      permissionTableRef.current?.clearSelectedRows();
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

  const hasFullAccess =
    role != null &&
    Array.isArray(role.permissions?.[FULL_ACCESS_MODULE]) &&
    role.permissions[FULL_ACCESS_MODULE].includes(FULL_ACCESS_CODE);

  const onFullAccessChange = async (checked: boolean) => {
    if (!role || !roleId) return;
    setSaving(true);
    setError(null);
    const newPermissions: RolePermissions = { ...(role.permissions ?? {}) };
    if (checked) {
      newPermissions[FULL_ACCESS_MODULE] = [FULL_ACCESS_CODE];
    } else {
      delete newPermissions[FULL_ACCESS_MODULE];
    }
    try {
      await updateRole(roleId, { permissions: newPermissions });
      await fetchRole();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar acceso total.");
    } finally {
      setSaving(false);
    }
  };

  if (!roleId) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">ID de rol no válido.</p>
      </DpContentInfo>
    );
  }

  if (loading && !role) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">Cargando…</p>
      </DpContentInfo>
    );
  }

  if (!role) {
    return (
      <DpContentInfo title="ROL" backLabel="Volver a roles" onBack={backToRoles}>
        <p className="text-zinc-500">Rol no encontrado.</p>
      </DpContentInfo>
    );
  }

  return (
    <DpContentInfo
      title={role.description || role.name}
      backLabel="Volver a roles"
      onBack={backToRoles}
      editLabel="Editar rol"
      onEdit={() => setEditRoleOpen(true)}
    >
      <div className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Acceso total */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Acceso</h2>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <Checkbox
              inputId="role-full-access"
              checked={hasFullAccess}
              onChange={(e) => onFullAccessChange(e.checked === true)}
              disabled={saving}
            />
            <label
              htmlFor="role-full-access"
              className="cursor-pointer text-sm text-zinc-700 dark:text-zinc-300"
            >
              Acceso total (permiso{" "}
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-600">*:*</code>)
            </label>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Si está activo, el rol tendrá todos los permisos sin definir módulos concretos.
            </span>
          </div>
        </section>

        {/* Permisos por módulo */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Permisos por módulo
          </h2>
          <DpContentHeader
            filterValue={permissionFilter}
            onFilter={handlePermissionFilter}
            onCreate={() => {
              setPermissionEditModuleId(null);
              setPermissionDialogOpen(true);
            }}
            onDelete={deletePermissions}
            deleteDisabled={selectedPermissionCount === 0 || saving}
            filterPlaceholder="Filtrar por módulo o permisos..."
          />
          <DpTable<PermissionRow>
            ref={permissionTableRef}
            tableDef={PERMISSIONS_TABLE_DEF}
            linkColumn="moduleId"
            onDetail={(row) => {
              setPermissionEditModuleId(row.moduleId);
              setPermissionDialogOpen(true);
            }}
            onEdit={(row) => {
              setPermissionEditModuleId(row.moduleId);
              setPermissionDialogOpen(true);
            }}
            onSelectionChange={(rows) => setSelectedPermissionCount(rows.length)}
            showFilterInHeader={false}
            emptyMessage="No hay permisos asignados. Agregar para definir."
            emptyFilterMessage="No hay resultados."
          />
        </section>

        <SetRolePermissionDialog
          visible={permissionDialogOpen}
          roleId={roleId}
          editModuleId={permissionEditModuleId}
          currentPermissions={role.permissions ?? {}}
          onSuccess={async () => {
            setPermissionDialogOpen(false);
            await fetchRole();
          }}
          onHide={() => setPermissionDialogOpen(false)}
        />

        <SetRoleDialog
          visible={editRoleOpen}
          roleId={roleId}
          onSuccess={() => {
            setEditRoleOpen(false);
            fetchRole();
          }}
          onHide={() => setEditRoleOpen(false)}
        />
      </div>
    </DpContentInfo>
  );
}
