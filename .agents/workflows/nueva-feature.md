---
description: Crear una nueva feature completa (types + service + rutas + dialog)
---

# Workflow: Nueva Feature

Sigue estos pasos en orden para crear una feature nueva siguiendo los estándares del proyecto.

## Paso 1 — Crear el modelo y servicio en `features/`

// turbo
1. Crear las carpetas necesarias:
```powershell
New-Item -ItemType Directory -Force "app/features/{feature}"
```

2. Crear `app/features/{feature}/{feature}.types.ts` con las interfaces del dominio.

3. Crear `app/features/{feature}/{feature}.service.ts` con las funciones CRUD.
   - Importar `db` de `~/lib/firebase`
   - Importar tipos desde `./{feature}.types`
   - Nunca importar de `~/lib/firestore-*` (esos archivos ya no existen)

4. Crear `app/features/{feature}/index.ts` (barrel):
   ```typescript
   export * from "./{feature}.types";
   export * from "./{feature}.service";
   ```

## Paso 2 — Crear las rutas en `routes/system/{feature}/`

// turbo
5. Crear las carpetas:
```powershell
New-Item -ItemType Directory -Force "app/routes/system/{feature}"
```

6. Crear `app/routes/system/{feature}/page.tsx`:
   - Exportar `clientLoader` que llama al servicio
   - Componente recibe `{ loaderData }: Route.ComponentProps`
   - Usar `useRevalidator` para refrescar, NO `useEffect`
   - Usar `useMatch` para detectar rutas hijo (add/edit)
   - `DpTable` con prop `data={loaderData.items}` y `loading={isLoading}`

7. Crear `app/routes/system/{feature}/add.tsx` — solo `meta()` + `return null`

8. Crear `app/routes/system/{feature}/edit.tsx` — solo `meta()` + `return null`

9. Crear `app/routes/system/{feature}/Set{Feature}Dialog.tsx`:
   - Importar `useNavigation` de `react-router`
   - `const isNavigating = navigation.state !== "idle"`
   - `<DpContentSet saving={saving || isNavigating} saveDisabled={!valid || isNavigating}>`
   - Usar `DpInput` para todos los campos (type: input, select, check, number, date)

## Paso 3 — Registrar la ruta

10. Agregar a `app/routes.ts`:
    ```typescript
    route("system/{feature}", "routes/system/{feature}/page.tsx", [
      route("add",      "routes/system/{feature}/add.tsx"),
      route("edit/:id", "routes/system/{feature}/edit.tsx"),
    ]),
    ```

## Paso 4 — Verificar

// turbo
11. Regenerar tipos y verificar TypeScript:
```powershell
npx react-router typegen; npx tsc --noEmit
```

## Notas importantes

- Los imports de servicios usan el barrel: `import { get{Feature}s } from "~/features/{feature}"`
- La autenticación está en el `clientLoader` del dashboard — no agregar guards en las páginas hijas
- Consultar `AGENTS.md` en la raíz del proyecto para la referencia completa de componentes
