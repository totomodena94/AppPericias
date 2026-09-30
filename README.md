# App Pericias

Solución para estudios de peritaje que trabajan con múltiples concesionarios, orientada a registrar y analizar pericias de estado de uso de vehículos.

## Propósito

Los estudios de peritaje que operan con varios concesionarios enfrentan un registro disperso y manual de sus pericias, sin posibilidad de exportar datos desde los sistemas habituales del sector (Waluta, Wincar). Esta app centraliza la carga de cada pericia, permite su consulta y edición, y genera análisis simples (volumen mensual, vendedores más activos por concesionario, tasa de conversión a segunda pericia) además de un archivo exportable para la rendición de cuentas mensual.

## Estado actual

En desarrollo activo. Completado hasta el momento:

- **Milestone 1** — Diseño y estructura base: layout con CSS Grid, HTML semántico, paleta y tipografía con CSS Custom Properties.
- **Milestone 2** — Formulario de carga con validación (Constraint Validation API) y persistencia en `localStorage`.
- **Milestone 3** — Visualización y gestión de datos: tabla dinámica, edición y eliminación de pericias.
- **Milestone 4** — Exportación mensual a CSV y checkpoint de cierre de mes.
- Importación de histórico de pericias desde CSV, incorporada como funcionalidad adicional.

**En curso — Milestone 5 (analítica y gráficas):** tendencia mensual de pericias, distribución por día de la semana, distribución por tipo (perizia/controperizia/demo).

**Próximo milestone — Backend real:** migrar la persistencia de `localStorage` a una base de datos, y evaluar la necesidad de soporte multiusuario.

## Stack

- HTML5
- CSS3 (Grid, Custom Properties)
- JavaScript (vanilla — sin frameworks ni librerías)
- Persistencia: localStorage (sin backend por ahora)

## Flujo de trabajo

Ver [WORKFLOW.md](./WORKFLOW.md) para las convenciones de ramas, commits y el checklist de Definition of Done que se sigue antes de mergear cualquier cambio.

## Roadmap

Ver [Milestones](../../milestones) e [Issues](../../issues) del repositorio.
