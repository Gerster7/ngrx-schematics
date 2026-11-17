import {
	Rule,
	SchematicContext,
	SchematicsException,
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

// Palabras reservadas de JS/TS en strict mode: el nombre camelizado se usa como identificador.
const RESERVED_WORDS = new Set([
	'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
	'default', 'delete', 'do', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'finally',
	'for', 'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'let',
	'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'static', 'super',
	'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
]);

// Identificadores que los templates ya usan en el mismo scope que el nombre camelizado.
const TEMPLATE_IDENTIFIERS = new Set(['state', 'adapter']);

function validateName(name: string): void {
	const identifier = strings.camelize(name);
	if (RESERVED_WORDS.has(identifier)) {
		throw new SchematicsException(`"${name}" es una palabra reservada de JavaScript y no puede usarse como nombre del estado.`);
	}
	if (TEMPLATE_IDENTIFIERS.has(identifier)) {
		throw new SchematicsException(`"${name}" choca con identificadores del código generado (${[...TEMPLATE_IDENTIFIERS].join(', ')}). Elegí otro nombre.`);
	}
}

function resolveTargetBaseDir(rawPath: string): Path {
	if (/^[a-zA-Z]:/.test(rawPath)) {
		throw new SchematicsException(`El path "${rawPath}" debe ser relativo a la raíz del workspace, no una ruta absoluta del sistema.`);
	}
	const workspaceRelativePath = normalize(rawPath.replace(/^[/\\]+/, ''));
	if (workspaceRelativePath === '..' || workspaceRelativePath.startsWith('../')) {
		throw new SchematicsException(`El path "${rawPath}" apunta fuera del workspace.`);
	}
	return join(WORKSPACE_ROOT, workspaceRelativePath);
}

function toImportPath(fromDir: Path, toDir: Path): string {
	const relativePath = relative(fromDir, toDir);
	if (!relativePath) {
		return '.';
	}
	return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

export function stateSchematic(options: StateOptions): Rule {
	return (_tree: Tree, _context: SchematicContext) => {
		validateName(options.name);

		const fileName = strings.dasherize(options.name);
		const targetDir = join(resolveTargetBaseDir(options.path), fileName);

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
