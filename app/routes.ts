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
    route("system/users", "routes/system/users/page.tsx"),
    route("system/roles", "routes/system/roles/page.tsx"),
    route("system/roles/:id", "routes/system/roles/detail.tsx"),
    route("system/modules", "routes/system/modules/page.tsx"),
    route("system/modules/:id", "routes/system/modules/detail.tsx"),
    route("system/sequences", "routes/system/sequences/page.tsx", [
      route("add", "routes/system/sequences/add.tsx"),
      route("edit/:id", "routes/system/sequences/edit.tsx"),
    ]),
    route("system/counters", "routes/system/counters/page.tsx", [
      route("add", "routes/system/counters/add.tsx"),
      route("edit/:id", "routes/system/counters/edit.tsx"),
    ]),
    route("master/document-types", "routes/placeholder/master-document-types.tsx"),
    route("master/documents", "routes/placeholder/master-documents.tsx"),
    route("master/clients", "routes/master/clients/page.tsx", [
      route("add", "routes/master/clients/add.tsx"),
      route("edit/:id", "routes/master/clients/edit.tsx"),
    ]),
    route("master/clients/:id/locations", "routes/master/clients/locations.tsx", [
      route("add", "routes/master/clients/locations-add.tsx"),
      route("edit/:locationId", "routes/master/clients/locations-edit.tsx"),
    ]),
    route("human-resource/employees", "routes/human-resource/employees/page.tsx", [
      route("add", "routes/human-resource/employees/add.tsx"),
      route("edit/:id", "routes/human-resource/employees/edit.tsx"),
    ]),
    route("human-resource/contracts", "routes/placeholder/hr-contracts.tsx"),
    route("human-resource/positions", "routes/human-resource/positions/page.tsx", [
      route("add", "routes/human-resource/positions/add.tsx"),
      route("edit/:id", "routes/human-resource/positions/edit.tsx"),
    ]),
    route("human-resource/resources", "routes/human-resource/resources/page.tsx", [
      route("add", "routes/human-resource/resources/add.tsx"),
      route("edit/:id", "routes/human-resource/resources/edit.tsx"),
    ]),
    route("human-resource/resources/:id/costs", "routes/human-resource/resources/costs.tsx", [
      route("add", "routes/human-resource/resources/costs-add.tsx"),
      route("edit/:costId", "routes/human-resource/resources/costs-edit.tsx"),
    ]),
    route("logistic/orders", "routes/placeholder/logistic-orders.tsx"),
    route("transport/transport-services", "routes/transport/transport-services/page.tsx", [
      route("add", "routes/transport/transport-services/add.tsx"),
      route("edit/:id", "routes/transport/transport-services/edit.tsx"),
    ]),
    route("transport/transport-contracts", "routes/placeholder/transport-contracts.tsx"),
    route("transport/vehicles", "routes/placeholder/transport-vehicles.tsx"),
    route("transport/drivers", "routes/transport/drivers/page.tsx", [
      route("add", "routes/transport/drivers/add.tsx"),
      route("edit/:id", "routes/transport/drivers/edit.tsx"),
    ]),
    route("transport/plans", "routes/placeholder/transport-plans.tsx"),
    route("transport/routes", "routes/placeholder/transport-routes.tsx"),
    route("transport/trips", "routes/placeholder/transport-trips.tsx"),
  ]),
] satisfies RouteConfig;
