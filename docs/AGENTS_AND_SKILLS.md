# Agentes y skills de Gavel

Versión documentada: **0.12.1**.

Este documento describe las superficies de IA de Gavel, sus límites y su relación con la ejecución en CI. El inventario canónico contiene **8 agentes core**, **31 skills core** y **4 companion skills**. El repositorio también incluye un agente interactivo adicional para revisar pull requests de Azure DevOps.

## Conceptos

| Superficie | Qué es | Cómo se ejecuta |
|---|---|---|
| Agente | Especialista con objetivo, herramientas y límites propios | Un host de agentes, por ejemplo GitHub Copilot, interpreta `agents/*.md` |
| Skill | Instrucción reutilizable para una tarea o framework | El host la invoca como `/gavel-*` o la carga como contexto |
| CLI | Programa determinista con códigos de salida | Un shell local o un job de CI ejecuta `gavel <comando>` |
| Companion skill | Flujo opcional fuera del núcleo de calidad de tests | El host la carga solo cuando el equipo necesita CI, ambiente, integraciones o cierre |

Un archivo Markdown de agente o skill no es un proceso ejecutable. Para jobs repetibles y gates de PR, use el [CLI de Gavel](CLI_MATRIX.md). Los agentes requieren un host de IA que les proporcione las herramientas declaradas y acceso controlado al workspace.

## Modelo de estimación

Los tiempos siguientes son una **estimación de reconstrucción asistida por IA**, no horas históricas registradas. La IA investiga el repositorio, redacta, cruza referencias, genera ejemplos y ejecuta validaciones. Una persona con experiencia en QA automation guía las decisiones relevantes y aprueba el resultado.

Cada rango representa **tiempo transcurrido de trabajo IA + humano**, no la suma de horas de ambos. Incluye definición del objetivo, investigación técnica, redacción, revisión contra la Constitución, ejemplos mínimos y una ronda de validación en un repositorio compatible. La dedicación humana esperada es normalmente de **15-30 % del rango**, concentrada en alcance, criterios de riesgo, revisión y aceptación. Supone que ya existen el host de agentes, la Constitución, los schemas, los scripts compartidos y un proyecto de prueba accesible.

No incluye desarrollar el motor CLI, parsers, scanners, conectores cloud, ambientes, datos, hardware móvil, aprobación de seguridad ni calibración empresarial. Cuando una definición depende de esas capacidades, se indica por separado. La incertidumbre esperada es de aproximadamente **±25 %** según claridad de requisitos y disponibilidad del ambiente.

| Complejidad | Tiempo IA + guía humana | Criterio |
|---|---:|---|
| XS | 0.5-1 h | Flujo corto, una salida y pocas dependencias |
| S | 1-2 h | Reglas acotadas y una integración conocida |
| M | 2-4 h | Varias decisiones, handoffs o comandos |
| L | 4-8 h | Orquestación, varios stacks o validación intensiva |
| XL | 8 h o más | Capacidad con software, infraestructura o gobierno adicional |

La guía humana se clasifica como **baja** cuando basta validar redacción, **media** cuando hay decisiones técnicas o de alcance y **alta** cuando intervienen seguridad, permisos, conducta autónoma o criterios de dominio regulado.

## Agentes core

| Agente | Scope | Herramientas | Edita | Ejecuta comandos | Crear con IA | Guía humana | Límite principal |
|---|---|---|---:|---:|---:|---|---|
| `gavel-orchestrator` | Detecta el trabajo, delega al especialista y valida el contrato de resultado | Read, Grep, Glob | No | No | 4-6 h (L) | Alta | No implementa ni verifica; un plan sin evidencia queda `INCOMPLETE` |
| `gavel-architect-review` | Ejecuta auditoría strict y luego revisión arquitectónica manual sin duplicar hallazgos | Read, Grep, Glob, Bash | No | Sí, solo análisis | 3-5 h (L) | Alta | No reemplaza strict, no modifica código y exige evidencia por archivo y línea |
| `gavel-generator` | Crea tests E2E con patrones nativos, fixtures, factories y POM existentes | Read, Grep, Glob, Edit, Write, Bash | Sí | Sí | 2-4 h (M) | Media | Un test por vez; exige evidencia de la aplicación y verificación ejecutable |
| `gavel-healer` | Diagnostica y corrige tests fallidos; clasifica test bug, app bug, ambiente o flake | Read, Grep, Glob, Edit, Write, Bash | Sí | Sí | 3-5 h (L) | Alta | Nunca modifica producto para hacer pasar el test ni oculta defectos con workarounds |
| `gavel-refactor` | Reduce duplicación y deuda estructural sin cambiar cobertura ni intención | Read, Grep, Glob, Edit, Write, Bash | Sí | Sí | 4-6 h (L) | Alta | No debilita assertions ni introduce abstracciones especulativas |
| `gavel-api-specialist` | Crea y ejecuta tests API mediante service layer, DI, factories y validación de contrato | Read, Grep, Glob, Edit, Write, Bash | Sí | Sí | 2-4 h (M) | Media | No usa HTTP crudo en specs, credenciales hardcoded ni configuración productiva |
| `gavel-fail-audit` | Audita expected-failure, skip, ignore, disabled, quarantine y WIP | Read, Grep, Glob, Edit, Bash | Restringido | Sí | 2-3 h (M) | Alta | Solo retira un marcador con prueba aprobada y evidencia suficiente; no hace limpieza masiva |
| `gavel-impact` | Correlaciona cambios de aplicación con mantenimiento o cobertura de automatización | Read, Grep, Glob, Bash | No | Solo análisis | 2-4 h (M) | Media | Recomienda el siguiente agente; no implementa ni ejecuta la suite |

**Total estimado para recrear los ocho agentes core con IA:** **22-37 horas de trabajo asistido**, de las cuales aproximadamente **6-12 horas** requieren atención humana.

### Autonomía de los agentes

| Modalidad | Viabilidad | Condiciones |
|---|---|---|
| Sesión interactiva en IDE | Sí | Workspace confiable, agente descubierto y herramientas autorizadas |
| Job con host de agentes | Condicionada | Runtime de IA, checkout, permisos mínimos, límites de archivos, secretos seguros y comandos de verificación |
| Job de CI sin LLM | No para Markdown; sí para CLI | Ejecutar comandos deterministas de Gavel, no `agents/*.md` |
| Cambio automático de tests | Condicionada | Solo generator, healer, refactor y API specialist; fail-audit tiene escritura limitada |
| Análisis sin cambios | Sí | Impact y orchestrator pueden operar con lectura; orchestrator necesita un mecanismo de delegación para completar el flujo |

Todo implementador debe devolver el [Gavel Result Envelope](../templates/result-envelope.md). Sin comando de test y conteo de aprobados/fallidos, el estado es `INCOMPLETE`, no `DONE`.

## Skills core

### Gobierno y diagnóstico

| Skill | Scope | Resultado esperado | Crear con IA | Guía humana |
|---|---|---|---:|---|
| `gavel` | Activa la Constitución y el nivel `lite`, `full`, `strict` u `off` | Reglas aplicables a la sesión | 3-5 h (M) | Alta |
| `gavel-help` | Referencia rápida de modos, skills y comandos | Guía de uso | 0.5-1 h (XS) | Baja |
| `gavel-detect` | Detecta framework, runner, lenguaje, POM y CI | Perfil técnico activo | 2-4 h (M) | Media |
| `gavel-audit` | Audita el repositorio completo por deuda y violaciones | Hallazgos priorizados; no aplica cambios | 2-4 h (M) | Media |
| `gavel-architect-review` | Ejecuta strict y complementa con revisión manual de estabilidad y arquitectura | Reporte combinado, separado y sin duplicados | 2-4 h (M) | Alta |
| `gavel-review` | Revisa diffs de tests por exceso, fragilidad y violaciones | Una acción concreta por hallazgo | 2-3 h (M) | Media |
| `gavel-self-check` | Escanea reglas mecánicas de la Constitución | Veredicto estático y código de salida | 1-2 h (S) | Media |
| `gavel-debt` | Recolecta comentarios `gavel:` y decisiones diferidas | Ledger de deuda; no modifica archivos | 0.5-1 h (XS) | Baja |
| `gavel-gain` | Resume salud de suite, pass rate, flakes, LOC y cobertura | Scorecard de calidad | 1-2 h (S) | Baja |
| `gavel-analyze` | Clasifica resultados de suite y agrupa fallos | Causa, pass rate y siguiente acción | 2-4 h (M) | Alta |
| `gavel-impact` | Relaciona fallos y cambios recientes | Commits sospechosos y mantenimiento requerido | 2-3 h (M) | Media |
| `gavel-heal` | Diagnostica un test fallido | Veredicto test bug, app bug, ambiente o flake | 2-4 h (M) | Alta |
| `gavel-flake` | Investiga condiciones de carrera, estado compartido y orden | Causa de flakiness y recomendación | 2-4 h (M) | Alta |
| `gavel-triage` | Localiza código de aplicación detrás de un fallo confirmado | Evidencia de archivo y función; solo lectura | 1-2 h (S) | Media |
| `gavel-bug` | Redacta un bug cuando la evidencia confirma defecto de producto | Reporte estandarizado | 0.5-1 h (XS) | Media |

### Planeamiento, autoría y ejecución

| Skill | Scope | Límite principal | Crear con IA | Guía humana |
|---|---|---|---:|---|
| `gavel-plan` | Diseña planes y escenarios ISTQB para API y UI | Planea; la implementación se delega | 1-2 h (S) | Media |
| `gavel-init` | Inicializa la estructura mínima de un proyecto QA | Reutiliza patrones detectados y evita scaffolding innecesario | 2-4 h (M) | Media |
| `gavel-e2e` | Guía la autoría de pruebas web end-to-end | POM, DI, factories y locators semánticos | 1-2 h (S) | Media |
| `gavel-api` | Guía la autoría de tests API con service layer | No gobierna OpenAPI, ambientes ni credenciales externas | 1.5-3 h (M) | Media |
| `gavel-run` | Configura y ejecuta pruebas con evidencia nativa | Debe informar comando exacto y conteo de resultados | 2-4 h (M) | Alta |
| `gavel-auth` | Resuelve autenticación multi-tenant y firm-scoped | No expone ni hardcodea secretos | 1-2 h (S) | Alta |
| `gavel-ci-check` | Revisa si un diff introduce riesgos de CI | Reporta safe/unsafe; no provisiona infraestructura | 1.5-3 h (M) | Alta |
| `gavel-pr-prep` | Prepara una rama para pull request | Opera Git; requiere autorización para publicar cambios | 2-3 h (M) | Alta |

### Perfiles de framework

| Skill | Stack cubierto | Convención principal | Crear con IA | Guía humana |
|---|---|---|---:|---|
| `gavel-playwright` | Playwright TS/JS, Python y .NET | Assertions web-first, fixtures y locators semánticos | 4-6 h (L) | Alta |
| `gavel-selenium` | Selenium WebDriver | WebDriverWait, locators nativos y fixture DI | 4-6 h (L) | Alta |
| `gavel-appium` | Appium con cliente C#/.NET | AppiumBy, waits nativos y composición POM | 3-5 h (M) | Alta |
| `gavel-appium-java` | Appium con Java/Kotlin | AppiumBy, fixtures y comandos Maven/Gradle | 3-5 h (M) | Alta |
| `gavel-cypress` | Cypress | Auto-retry assertions, `cy.intercept` y runner nativo | 3-5 h (M) | Media |
| `gavel-webdriverio` | WebdriverIO | `expect-webdriverio`, BiDi y services | 3-5 h (M) | Media |
| `gavel-cucumber` | Cucumber.js, Behave y Cucumber-JVM | Gherkin, steps delgados, hooks y tags | 3-5 h (M) | Alta |
| `gavel-robot` | Robot Framework | Resources, keywords y SeleniumLibrary/Browser | 3-5 h (M) | Media |

Los perfiles se activan según las capacidades detectadas. No son agentes independientes y no deben contarse como tales.

**Total estimado para recrear las treinta y una skills core con IA:** **62-109 horas de trabajo asistido**, con aproximadamente **15.5-31 horas** de atención humana.

## Companion skills

Los companion skills son opcionales y no forman parte del gate core.

| Skill | Scope | Fuera de scope | Crear con IA | Guía humana |
|---|---|---|---:|---|
| `gavel-ci` | Migración y ejecución de automatización en infraestructura cloud o CI | No reemplaza la política de calidad core | 2-4 h (M) | Alta |
| `gavel-env` | Preparación, seed y diagnóstico del ambiente local | No redacta tests ni corrige producto | 1-2 h (S) | Media |
| `gavel-hub` | Credenciales e integración con APIs o hubs externos | No guarda secretos en el repositorio | 1-2 h (S) | Alta |
| `gavel-close` | Resumen de cierre para Jira u otro issue tracker | Solo después de verificación QA completa | 0.5-1 h (XS) | Media |

**Total estimado para recrear los cuatro companion skills con IA:** **4.5-9 horas de trabajo asistido**, con aproximadamente **1.5-3 horas** de atención humana.

## Agente adicional de Azure DevOps

`azure-devops-pr-reviewer` vive en `.github/agents/` y no pertenece a los ocho agentes empaquetados en `agents/`.

| Atributo | Contrato |
|---|---|
| Scope | Revisión interactiva de deltas de PR por corrección de dominio, seguridad, tests, arquitectura, pipeline y trazabilidad |
| Herramientas | `read`, `search` |
| Escritura | No modifica código, comentarios, status ni votos |
| Salida | JSON sujeto al schema del reviewer |
| Autoridad | No reemplaza revisores humanos ni políticas obligatorias |
| CI | Azure Pipelines ejecuta `gavel ado-pr-review`; el `.agent.md` no es el runtime |
| Crear definición interactiva con IA | 1-2 h (S); guía humana alta |
| Construir capacidad productiva completa con IA | 40-80 h (XL), sin contar aprobaciones ni espera de infraestructura |

El piloto permanece en modo `shadow`. Los estados conservadores son `NEEDS_HUMAN_REVIEW` cuando falta contexto y `REVIEW_FAILED` ante errores técnicos o contratos inválidos. Consulte [Azure DevOps PR Reviewer](azure-devops-pr-reviewer.md).

## Resumen de esfuerzo

| Inventario | Cantidad | Tiempo IA + guía humana | Atención humana incluida |
|---|---:|---:|---:|
| Agentes core | 8 | 22-37 h | 6-12 h |
| Skills core | 31 | 62-109 h | 15.5-31 h |
| Companion skills | 4 | 4.5-9 h | 1.5-3 h |
| Agente interactivo de Azure DevOps | 1 | 1-2 h | 0.5-1 h |
| **Total de definiciones** | **44** | **89.5-157 h** | **23.5-47 h** |

El total equivale a aproximadamente **2-4 semanas de trabajo asistido** si se construye secuencialmente. Con dos flujos de IA en paralelo y una persona revisando hitos, el calendario razonable es **1-2 semanas**, siempre que los ambientes y requisitos ya estén disponibles.

La capacidad productiva completa es mayor que este total. Por ejemplo, el reviewer de Azure DevOps requiere además CLI, schema, validación semántica, corpus, pipeline, persistencia, permisos y gobierno; por eso su estimación productiva se presenta separada y no se suma al total de definiciones.

## Uso recomendado en CI

Para un gate autónomo, reproducible y sin dependencia de LLM:

```bash
npx --yes @dsolisp/gavel@0.12.1 audit --format sarif > gavel.sarif
```

Códigos de salida:

- `0`: limpio.
- `1`: hallazgos accionables en el umbral configurado.
- `2`: error de uso, configuración o schema.

Use los agentes para investigación y remediación asistida. Use el CLI para decisiones automáticas del pipeline. En entornos regulados, fije la versión, aplique permisos mínimos, conserve evidencia y no permita que un agente apruebe políticas que requieren segregación humana.

## Descubrimiento

VS Code descubre las definiciones mediante `.vscode/settings.json`:

- `agents/`: ocho agentes core.
- `.github/agents/`: agente adicional de Azure DevOps.
- `skills/`: treinta y una skills core.
- `companion/skills/`: cuatro skills opcionales.

En un monorepo, abra Gavel como raíz o habilite `chat.useCustomizationsInParentRepositories`. Para instalarlo en otro repositorio, copie las definiciones a `.github/agents/` y `.github/skills/`, o configure sus rutas explícitamente.

## Fuente de verdad

- Inventario de agentes core: `scripts/validate-manifest.js` y `scripts/verify-skills.js`.
- Skills publicadas: `plugin.yaml` y `skills/*/SKILL.md`.
- Agentes empaquetados: `agents/*.md` y la lista `files` de `package.json`.
- Contrato de resultados: `schemas/result-envelope.schema.json`.
- Matriz de ejecución: [CLI_MATRIX.md](CLI_MATRIX.md).
- Recomendación empresarial: [ENTERPRISE.md](ENTERPRISE.md).
