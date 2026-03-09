import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("registro", "routes/registro.tsx"),
  layout("routes/dashboard.tsx", [
    route("home", "routes/dashboard-home.tsx"),
    route("system/users",   "routes/system/users/page.tsx"),
    route("system/roles",   "routes/system/roles/page.tsx"),
    route("system/roles/:id", "routes/system/roles/detail.tsx"),
    route("system/modules", "routes/system/modules/page.tsx"),
    route("system/modules/:id", "routes/system/modules/detail.tsx"),
    route("system/sequences", "routes/system/sequences/page.tsx", [
      route("add",       "routes/system/sequences/add.tsx"),
      route("edit/:id",  "routes/system/sequences/edit.tsx"),
    ]),
    route("system/counters", "routes/system/counters/page.tsx", [
      route("add",       "routes/system/counters/add.tsx"),
      route("edit/:id",  "routes/system/counters/edit.tsx"),
    ]),
    route("masters/document-types", "routes/placeholder/masters-document-types.tsx"),
    route("masters/documents",      "routes/placeholder/masters-documents.tsx"),
    route("masters/clients",        "routes/placeholder/masters-clients.tsx"),
    route("human-resources/employees", "routes/placeholder/hr-employees.tsx"),
    route("human-resources/contracts", "routes/placeholder/hr-contracts.tsx"),
    route("human-resources/positions", "routes/placeholder/hr-positions.tsx"),
    route("human-resources/resources", "routes/placeholder/hr-resources.tsx"),
    route("logistics/orders",          "routes/placeholder/logistics-orders.tsx"),
    route("transport/transport-services",  "routes/placeholder/transport-services.tsx"),
    route("transport/transport-contracts", "routes/placeholder/transport-contracts.tsx"),
    route("transport/vehicles", "routes/placeholder/transport-vehicles.tsx"),
    route("transport/drivers",  "routes/placeholder/transport-drivers.tsx"),
    route("transport/plans",    "routes/placeholder/transport-plans.tsx"),
    route("transport/routes",   "routes/placeholder/transport-routes.tsx"),
    route("transport/trips",    "routes/placeholder/transport-trips.tsx"),
  ]),
] satisfies RouteConfig;
