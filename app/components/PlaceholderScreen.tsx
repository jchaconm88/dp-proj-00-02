import { useLocation } from "react-router";

const TITLES: Record<string, string> = {
  "/system/modules": "Módulos",
  "/system/sequences": "Secuencias",
  "/system/counters": "Contadores",
  "/masters/document-types": "Tipos de Documento",
  "/masters/documents": "Documentos",
  "/masters/clients": "Clientes",
  "/human-resources/employees": "Empleados",
  "/human-resources/contracts": "Contratos Laborales",
  "/human-resources/positions": "Cargos",
  "/human-resources/resources": "Recursos Externos",
  "/logistics/orders": "Pedidos",
  "/transport/transport-services": "Servicios",
  "/transport/transport-contracts": "Contratos",
  "/transport/vehicles": "Vehículos",
  "/transport/drivers": "Conductores",
  "/transport/plans": "Planes",
  "/transport/routes": "Rutas",
  "/transport/trips": "Viajes",
};

export default function PlaceholderScreen() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? pathname.split("/").filter(Boolean).pop() ?? "Pantalla";
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-navy-600 dark:bg-navy-800">
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-navy-100">{title}</h1>
      <p className="text-zinc-600 dark:text-navy-300">Pantalla en construcción.</p>
    </div>
  );
}
