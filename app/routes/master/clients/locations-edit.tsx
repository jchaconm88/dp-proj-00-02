import type { Route } from "./+types/locations-edit";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Editar Ubicación" },
        { name: "description", content: "Formulario para editar ubicación de cliente" },
    ];
}

export default function LocationEditPage() {
    return null;
}
