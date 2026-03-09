/**
 * Opciones de estado centralizadas para:
 * - DpTable type="status" (chip con label + color/severity)
 * - Selects en pantallas Set (options con label + value)
 */

export type StatusSeverity = "success" | "info" | "warning" | "danger" | "secondary";

export interface StatusOption {
  label: string;
  severity: StatusSeverity;
}

/** Convierte un objeto de opciones (valor → { label, severity }) en array para DpInput type="select". */
export function statusToSelectOptions(
  obj: Record<string, StatusOption>
): { label: string; value: string }[] {
  return Object.entries(obj).map(([value, { label }]) => ({ label, value }));
}

/** Periodo de reinicio de secuencias. */
export const RESET_PERIOD: Record<string, StatusOption> = {
  never: { label: "Nunca", severity: "secondary" },
  yearly: { label: "Anual", severity: "info" },
  monthly: { label: "Mensual", severity: "info" },
  daily: { label: "Diario", severity: "info" },
};

/** Estado de empleados. */
export const EMPLOYEE_STATUS: Record<string, StatusOption> = {
  active:    { label: "Activo",    severity: "success"   },
  inactive:  { label: "Inactivo",  severity: "secondary" },
  suspended: { label: "Suspendido", severity: "warning"  },
};

/** Tipo de salario. */
export const SALARY_TYPE: Record<string, StatusOption> = {
  monthly: { label: "Mensual", severity: "info" },
  weekly:  { label: "Semanal", severity: "info" },
  daily:   { label: "Diario",  severity: "info" },
};
