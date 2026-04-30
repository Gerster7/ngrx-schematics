# ngrx-state-schematic

Schematic para generar estados NgRx completos (actions, reducer, selectors, effects) en proyectos Angular.

## Instalación

```bash
npm install ngrx-state-schematic --save-dev
```

## Configuración (una sola vez por proyecto)

Registrá el schematic en tu proyecto para poder usarlo con el alias corto `state`:

```bash
ng config cli.schematicCollections '["ngrx-state-schematic"]'
```

Esto agrega la siguiente línea en tu `angular.json`:

```json
{
  "cli": {
    "schematicCollections": ["ngrx-state-schematic"]
  }
}
```

A partir de ahí ya no necesitás escribir el prefijo `ngrx-state-schematic:` nunca más.

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

| Opción   | Tipo     | Default                  | Descripción                              |
|----------|----------|--------------------------|------------------------------------------|
| `name`   | `string` | *(obligatorio)*          | Nombre del estado (ej: `producto`)       |
| `path`   | `string` | `src/app/core/state`     | Ruta destino de los archivos generados   |

## Archivos generados

Dado `ng generate ngrx-state-schematic:state producto --path src/app/features/state`:

```
src/app/features/state/producto/
├── producto.actions.ts
├── producto.effects.ts
├── producto.reducer.ts
└── producto.selectors.ts
```

## Notas

- En `reducer.ts` ajustá `selectId` para que apunte a la clave primaria real de tu modelo (por defecto usa `.id`).
- Los imports en effects y selectors usan el `path` que indicaste, no uno hardcodeado.

## Desarrollo local

```bash
npm install
npm run build
# En tu proyecto Angular:
npm install ../ruta/a/ngrx-state-schematic
ng generate ngrx-state-schematic:state producto
```
