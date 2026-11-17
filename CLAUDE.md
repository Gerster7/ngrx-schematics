# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Paquete npm (`ngrx-schematic`) con una colección de Angular Schematics que genera un estado NgRx completo (actions, reducer con `@ngrx/entity`, selectors y effects funcionales) dentro de un proyecto Angular consumidor. Hay un único schematic: `state-schematic` (alias `state`).

## Comandos

```bash
npm install
npm run build   # clean + tsc → dist/ + copia de *.json y de los templates a dist/
npm test        # build + node:test sobre test/**/*.test.mjs
npm run build && node --test --test-name-pattern "compila" "test/**/*.test.mjs"   # un test puntual
```

- Gestor: npm (hay `package-lock.json`). No hay linter ni formatter configurados.
- Los tests corren contra `dist/`, no contra `src/`: siempre buildear antes.
- `npm publish` corre los tests (`prepublishOnly`) y publica únicamente `dist/` (campo `files`).
- Los globs de `copyfiles` van entrecomillados a propósito: sin comillas, en shells POSIX se pierde `dist/collection.json`.

## Arquitectura

- `package.json` (`schematics`/`main`) apunta a `dist/collection.json`: sin build no hay nada consumible.
- `src/collection.json` registra el schematic → factory `stateSchematic` en `src/state-schematic/index.ts`.
- La factory valida `name`/`path`, calcula el directorio destino (`<path>/<dasherize(name)>`, siempre dentro del workspace) y la ruta relativa al directorio de servicios (`serviceImportDir`), y aplica `applyTemplates({ ...options, ...strings, serviceImportDir })` sobre `files/`. `applyTemplates` resuelve `__name@dasherize__` en los nombres de archivo y quita el sufijo `.template`.
- Validación en dos capas: el formato de `name` vive en `schema.json` (`pattern`, así el `x-prompt` re-pregunta); palabras reservadas, nombres que chocan con identificadores de los templates (`state`, `adapter`) y `path` fuera del workspace se validan en la factory con `SchematicsException`.
- `schema.json` y `schema.ts` se mantienen sincronizados a mano: una opción nueva va en ambos.
- Los `*.ts.template` quedan fuera de `tsc` (`include: ["src"]` + `exclude` de `files/`) y se copian tal cual con `copyfiles`. Si se agrega otro schematic, sumar su carpeta `files/` al script de copia y al `exclude`.
- `.gitattributes` fuerza LF: los templates se copian byte a byte a los proyectos consumidores.

## Tests

`test/state-schematic.test.mjs` ejecuta el schematic con `SchematicTestRunner` y typechequea la salida con la API de TypeScript, usando las opciones strict del Angular CLI, contra `@ngrx/*` 17 reales (devDependencies). Escribe stubs de modelo/servicio y un `app.config.ts` que registra cada estado con `provideState`/`provideEffects`, en un workspace temporal bajo `.tmp/` (ignorado). Ante cambios en templates, agregar casos ahí (nombres compuestos, paths raros) en lugar de probar a mano.

## Contrato con el proyecto consumidor

Convenciones hardcodeadas en los templates; cambiarlas es breaking para quienes ya usan el paquete:

- Modelo en `src/app/core/services/<name>/<name>.model.ts` exportando `<Name>Model` con propiedad `id`.
- Servicio en `src/app/core/services/<name>/<name>.service.ts` exportando `<Name>Service` con `get<Name>()` que devuelve un Observable cuya respuesta trae el array en `.datos`.
- Todos los imports generados son relativos (no dependen de `baseUrl`).
- El `name` de `createFeature` debe ser `camelize(name)`: NgRx deriva de él `select${capitalize(name)}State`, y el template de selectors lo desestructura como `select<Classify>State`. Con `dasherize`, los nombres compuestos no compilan.
