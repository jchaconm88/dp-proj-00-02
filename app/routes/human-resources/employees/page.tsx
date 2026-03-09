import { useRef, useState } from "react";
import { useNavigate, useNavigation, useRevalidator, useMatch } from "react-router";
import { getEmployees, deleteEmployee, type EmployeeRecord } from "~/features/employees";
import type { Route } from "./+types/page";
import { DpContent, DpContentHeader } from "~/components/DpContent";
import { DpTable, type DpTableRef, type DpTableDefColumn } from "~/components/DpTable";
import { EMPLOYEE_STATUS } from "~/constants/status-options";
import SetEmployeeDialog from "./SetEmployeeDialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Empleados" },
    { name: "description", content: "Gestión de empleados" },
  ];
}

type EmployeeRow = EmployeeRecord & { fullName: string; salaryDisplay: string };

const TABLE_DEF: DpTableDefColumn[] = [
  { header: "Código",      column: "code",          order: 1, display: true, filter: true },
  { header: "Nombre",      column: "fullName",       order: 2, display: true, filter: true },
  { header: "Nº Doc",      column: "documentNo",     order: 3, display: true, filter: true },
  { header: "Cargo",       column: "position",       order: 4, display: true, filter: true },
  { header: "F. Ingreso",  column: "hireDate",       order: 5, display: true, filter: true, type: "date" },
  { header: "Estado",      column: "status",         order: 6, display: true, filter: true, type: "status", typeOptions: EMPLOYEE_STATUS },
  { header: "Salario",     column: "salaryDisplay",  order: 7, display: true, filter: true },
];

export async function clientLoader() {
  const { items } = await getEmployees();
  const rows: EmployeeRow[] = items.map((e) => ({
    ...e,
    fullName: `${e.firstName} ${e.lastName}`.trim() || "—",
    salaryDisplay: e.payroll ? `${e.payroll.baseSalary} ${e.payroll.currency}` : "—",
  }));
  return { rows };
}

export default function EmployeesPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const tableRef = useRef<DpTableRef<EmployeeRow>>(null);

  const isLoading = navigation.state !== "idle" || revalidator.state === "loading";
  const isAdd = !!useMatch("/human-resources/employees/add");
  const editMatch = useMatch("/human-resources/employees/edit/:id");
  const editId = editMatch?.params.id ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);

  const dialogVisible = isAdd || !!editId;

  const handleFilter = (value: string) => {
    setFilterValue(value);
    tableRef.current?.filter(value);
  };

  const openAdd = () => navigate("/human-resources/employees/add");
  const openEdit = (row: EmployeeRow) =>
    navigate(`/human-resources/employees/edit/${encodeURIComponent(row.id)}`);

  const handleDelete = async () => {
    const selected = tableRef.current?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(selected.map((r) => deleteEmployee(r.id)));
      tableRef.current?.clearSelectedRows();
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccess = () => {
    navigate("/human-resources/employees");
    revalidator.revalidate();
  };

  const handleHide = () => navigate("/human-resources/employees");

  return (
    <DpContent title="EMPLEADOS">
      <DpContentHeader
        filterValue={filterValue}
        onFilter={handleFilter}
        onLoad={() => revalidator.revalidate()}
        onCreate={openAdd}
        onDelete={handleDelete}
        deleteDisabled={selectedCount === 0 || saving}
        loading={isLoading}
        filterPlaceholder="Filtrar por código, nombre, documento..."
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <DpTable<EmployeeRow>
        ref={tableRef}
        data={loaderData.rows}
        loading={isLoading}
        tableDef={TABLE_DEF}
        linkColumn="code"
        onDetail={openEdit}
        onEdit={openEdit}
        onSelectionChange={(rows) => setSelectedCount(rows.length)}
        showFilterInHeader={false}
        emptyMessage='No hay empleados registrados.'
        emptyFilterMessage="No hay resultados para el filtro."
      />

      <SetEmployeeDialog
        visible={dialogVisible}
        employeeId={editId}
        onSuccess={handleSuccess}
        onHide={handleHide}
      />
    </DpContent>
  );
}
