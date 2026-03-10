import type { Route } from "./+types/edit";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Editar Servicio de Transporte" },
        { name: "description", content: "Formulario para editar servicio de transporte" },
    ];
}

export default function TransportServiceEditPage() {
    return null;
}
