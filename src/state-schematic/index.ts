import {
	Rule,
	SchematicContext,
	Tree,
	apply,
	url,
	template,
	move,
	mergeWith,
	applyTemplates,
} from '@angular-devkit/schematics';
import { strings, normalize } from '@angular-devkit/core';
import { Schema as StateOptions } from './schema';

export function stateSchematic(options: StateOptions): Rule {
	return (_tree: Tree, _context: SchematicContext) => {
		if (!options.name) {
			throw new Error('El nombre del estado es obligatorio.');
		}

		// Ruta destino: usa el path indicado o el default del schema
		const targetPath = normalize(
			`${options.path}/${strings.dasherize(options.name)}`
		);

		// Apuntamos a la carpeta "files" (donde están los .ts.template)
		const sourceTemplates = url('./files');

		// Aplicamos helpers de strings (classify, dasherize, etc.)
		// Angular Schematics elimina automáticamente el sufijo ".template"
		const sourceParameterized = apply(sourceTemplates, [
			applyTemplates({
				...options,
				...strings,
			}),
			move(targetPath),
		]);

		// Fusionamos todo
		return mergeWith(sourceParameterized);
	};
}
