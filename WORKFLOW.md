# Flujo de trabajo

Convenciones para desarrollar este proyecto issue por issue, con la IA como
escritora de código y Lorenzo como responsable de Git/GitHub y de la revisión.

## 1. Todo empieza en un issue

Antes de escribir código, el issue tiene que decir:
- **Contexto**: qué problema hay o qué falta.
- **Criterios de aceptación**: lista de "esto tiene que pasar" para poder
  cerrarlo. Si no se puede escribir esta lista, el issue todavía no está
  listo para trabajarse.
- **Fuera de alcance** (opcional): qué NO incluye este issue, para que no se
  vaya expandiendo mientras se trabaja.

## 2. Una rama por issue

```
git checkout -b issue-<numero>-<slug-corto>
```

Ya se venía haciendo así (`issue-17-calculo-analitica`, etc.) — se formaliza
como regla, no como costumbre. Nunca se trabaja directo sobre `main`.

## 3. Commits

Prefijos semánticos + mensaje descriptivo en inglés (como ya se viene
haciendo):

- `feat: ...` — funcionalidad nueva
- `fix: ...` — corrección de un bug
- `refactor: ...` — cambio interno sin cambiar comportamiento
- `docs: ...` — documentación (README, este archivo, comentarios)
- `chore: ...` — mantenimiento (dependencias, configuración)
- `test: ...` — tests

Commit en puntos naturales de avance, no un solo commit gigante al final.

## 4. Antes de pedirle código a la IA

Dar el número de issue y sus criterios de aceptación, no solo "hacé X". Así
el resultado se puede revisar contra algo concreto, en vez de "a ojo".

## 5. Antes de mergear: Definition of Done

Ningún PR se mergea a `main` sin pasar este checklist. Es la parte que
reemplaza a un ingeniero senior revisando el código de uno más junior — acá
ese rol lo hace Lorenzo, revisando lo que escribió la IA.

- [ ] **Funcional** — cumple todos los criterios de aceptación del issue,
  ni más ni menos.
- [ ] **Seguridad — datos de usuario**: todo texto libre que un usuario
  escribe (ej. el campo `notas`) y que se pinta en el DOM, ¿se inserta como
  texto plano (`textContent`, `innerText`) o se escapa antes de ir a
  `innerHTML`? Insertar texto de usuario sin escapar dentro de `innerHTML`
  es una vulnerabilidad (XSS), no un detalle de estilo.
- [ ] **Seguridad — datos sensibles**: ¿hay nombres de clientes, patentes,
  tokens o claves escritos directo en el código o en un archivo que se sube
  al repo? Si el repo es público, cualquier dato ahí es público.
- [ ] **Casos borde**: ¿qué pasa si el array de pericias está vacío? ¿Si
  `localStorage.getItem(...)` devuelve `null` o algo corrupto (no es JSON
  válido)? ¿Si un campo esperado no existe en un registro viejo importado
  del histórico?
- [ ] **Escalabilidad para el volumen real**: con ~300 pericias/mes, en un
  año son ~3600, en tres años ~11000. ¿La función sigue siendo rápida con
  esa cantidad, o recorre el array completo varias veces por cada
  interacción (por ejemplo, dentro de un loop)? No hace falta optimizar de
  más, pero sí evitar trabajo repetido innecesario.
- [ ] **Legibilidad**: nombres de variables y funciones en el mismo idioma
  y estilo que el resto del archivo; un comentario donde la lógica no sea
  obvia a primera lectura.
- [ ] **Documentación**: si el cambio mueve el estado del proyecto (se
  completa un milestone, cambia una decisión de arquitectura), el README
  se actualiza en el mismo PR — no se posterga para "después".
- [ ] **Probado a mano**: pasos concretos que se siguieron para verificar
  que funciona (todavía no hay tests automatizados), incluyendo al menos
  un caso borde de los de arriba.

## 6. Cerrar el issue

El PR referencia el issue (`Closes #N`) para que se cierre solo al
mergear. El roadmap (milestones) se revisa después de cada merge, no una
vez por mes — así el README y los milestones nunca quedan más de un PR
desactualizados.
