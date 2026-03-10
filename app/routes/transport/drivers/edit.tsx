import type { Route } from "./+types/edit";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Editar Conductor" },
        { name: "description", content: "Formulario para editar conductor" },
    ];
}

export default function DriverEditPage() {
    return null;
}
