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

/** Convierte un objeto de opciones (valor â†’ { label, severity }) en array para DpInput type="select". */
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

/** Estado de recursos externos. */
export const RESOURCE_STATUS: Record<string, StatusOption> = {
  active:    { label: "Activo",    severity: "success"   },
  inactive:  { label: "Inactivo",  severity: "secondary" },
  suspended: { label: "Suspendido", severity: "warning"  },
};

/** Tipo de vinculación remota. */
export const RESOURCE_ENGAGEMENT_TYPE: Record<string, StatusOption> = {
  sporadic:  { label: "Esporádico",  severity: "info" },
  permanent: { label: "Permanente", severity: "info" },
  contract:  { label: "Contrato",    severity: "info" },
};

/** Tipo de costo de recurso. */
export const RESOURCE_COST_TYPE: Record<string, StatusOption> = {
  per_trip: { label: "Por viaje", severity: "info" },
  per_hour: { label: "Por hora", severity: "info" },
  per_day:  { label: "Por día", severity: "info" },
  fixed:    { label: "Fijo", severity: "info" },
};

/** Moneda. */
export const CURRENCY: Record<string, StatusOption> = {
  PEN: { label: "Soles (PEN)", severity: "success" },
  USD: { label: "Dólares (USD)", severity: "success" },
};
