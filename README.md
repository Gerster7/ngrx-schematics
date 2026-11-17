# ngrx-schematic

Schematic para generar estados NgRx completos (actions, reducer, selectors, effects) en proyectos Angular.

## Instalación

```bash
npm install ngrx-schematic --save-dev
```

## Requisitos del proyecto

- Angular y NgRx 17 o superior, con `@ngrx/store`, `@ngrx/effects` y `@ngrx/entity` instalados.
- Un modelo y un servicio por estado, en esta ubicación y con esta forma (ejemplo para `orden-compra`):

```
src/app/core/services/orden-compra/
├── orden-compra.model.ts     → export interface OrdenCompraModel { id: ...; ... }
└── orden-compra.service.ts   → export class OrdenCompraService {
                                  getOrdenCompra(): Observable<{ datos: OrdenCompraModel[] }>
                                }
```

El effect generado llama a `get<Nombre>()` y carga en el store el array que viene en `datos`.

## Configuración (una sola vez por proyecto)

Registrá el schematic en tu proyecto para poder usarlo con el alias corto `state`:

```bash
ng config cli.schematicCollections '["ngrx-schematic"]'
```

Esto agrega la siguiente línea en tu `angular.json`:

```json
{
  "cli": {
    "schematicCollections": ["ngrx-schematic"]
  }
}
```

A partir de ahí ya no necesitás escribir el prefijo `ngrx-schematic:` nunca más.

## Uso

### Forma corta (recomendada)
```bash
ng generate state nombre-del-estado
```

### Con ruta personalizada
```bash
ng generate state producto --path src/app/features/catalogo/state
```

### Interactivo (te pregunta el nombre)
```bash
ng generate state
```

## Opciones

| Opción | Tipo     | Default              | Descripción |
|--------|----------|----------------------|-------------|
| `name` | `string` | *(obligatorio)*      | Nombre del estado (ej: `producto`, `orden-compra`, `detalleFactura`). Empieza con letra; solo letras, números y `-` o `_` entre palabras. No acepta palabras reservadas de JavaScript ni `state`/`adapter`. |
| `path` | `string` | `src/app/core/state` | Carpeta destino, relativa a la raíz del workspace. No puede apuntar fuera de él. |

## Archivos generados

Dado `ng generate ngrx-schematic:state producto --path src/app/features/state`:

```
src/app/features/state/producto/
├── producto.actions.ts
├── producto.effects.ts
├── producto.reducer.ts
└── producto.selectors.ts
```

## Registrar el estado

El schematic no modifica la configuración de la app. Registrá el feature y los effects donde corresponda (ej: `app.config.ts`, con `provideStore()` ya configurado):

```ts
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { productoFeature } from './core/state/producto/producto.reducer';
import * as productoEffects from './core/state/producto/producto.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    provideState(productoFeature),
    provideEffects(productoEffects),
  ],
};
```

## Notas

- En `reducer.ts` ajustá `selectId` para que apunte a la clave primaria real de tu modelo (por defecto usa `.id`).
- La clave del feature en el store es el nombre en camelCase (`orden-compra` → `ordenCompra`).
- Todos los imports del código generado son relativos: no requieren `baseUrl` ni `paths` en el `tsconfig`.

## Desarrollo local

```bash
npm install
npm test        # build + tests: genera estados y los compila contra NgRx real
# En tu proyecto Angular:
npm install ../ruta/a/ngrx-schematics
ng generate ngrx-schematic:state producto
```
