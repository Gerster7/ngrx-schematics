import {
	Rule,
	SchematicContext,
	Tree,
	apply,
	url,
	move,
	mergeWith,
	applyTemplates,
} from '@angular-devkit/schematics';
import { Path, join, normalize, relative, strings } from '@angular-devkit/core';
import { Schema as StateOptions } from './schema';

const WORKSPACE_ROOT = normalize('/');
const SERVICES_DIR = normalize('/src/app/core/services');

function toImportPath(fromDir: Path, toDir: Path): string {
	const relativePath = relative(fromDir, toDir);
	if (!relativePath) {
		return '.';
	}
	return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

export function stateSchematic(options: StateOptions): Rule {
	return (_tree: Tree, _context: SchematicContext) => {
		if (!options.name) {
			throw new Error('El nombre del estado es obligatorio.');
		}

		const fileName = strings.dasherize(options.name);
		const targetDir = join(WORKSPACE_ROOT, options.path, fileName);

		// Imports relativos: no dependen de baseUrl/paths del tsconfig del consumidor.
		const serviceImportDir = toImportPath(targetDir, join(SERVICES_DIR, fileName));

		// applyTemplates resuelve __name@dasherize__ y quita el sufijo ".template"
		const sourceParameterized = apply(url('./files'), [
			applyTemplates({
				...options,
				...strings,
				serviceImportDir,
			}),
			move(targetDir),
		]);

		return mergeWith(sourceParameterized);
	};
}
