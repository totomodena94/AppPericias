# App Pericias

Solución para estudios de peritaje que trabajan con múltiples concesionarios, orientada a registrar y analizar pericias de estado de uso de vehículos.

## Propósito

Los estudios de peritaje que operan con varios concesionarios enfrentan un registro disperso y manual de sus pericias, sin posibilidad de exportar datos desde los sistemas habituales del sector (Waluta, Wincar). Esta app centraliza la carga de cada pericia, permite su consulta y edición, y genera análisis simples (volumen mensual, vendedores más activos por concesionario, tasa de conversión a segunda pericia) además de un archivo exportable para la rendición de cuentas mensual.

## Estado actual

En desarrollo. Milestone 1 (diseño y estructura base) completado:
- Layout general definido con CSS Grid
- Estructura HTML semántica (header, panel de análisis, formulario, vista por rango)
- Paleta de colores y tipografía base aplicadas con CSS Custom Properties

Próximo milestone: formulario de carga con validación y persistencia en localStorage.

## Stack

- HTML5
- CSS3 (Grid, Custom Properties)
- JavaScript (vanilla — sin frameworks ni librerías)
- Persistencia: localStorage (sin backend por ahora)

## Roadmap

Ver [Milestones](../../milestones) e [Issues](../../issues) del repositorio.