import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SchematicTestRunner } = require('@angular-devkit/schematics/testing');
const { strings } = require('@angular-devkit/core');
const ts = require('typescript');

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const runner = new SchematicTestRunner('ngrx-schematic', join(repoRoot, 'dist', 'collection.json'));
const SERVICES_DIR = 'src/app/core/services';
const GENERATED_KINDS = ['actions', 'effects', 'reducer', 'selectors'];

const generate = (options) => runner.runSchematic('state', options);

function writeServiceStubs(workspace, name) {
	const fileName = strings.dasherize(name);
	const className = strings.classify(name);
	const serviceDir = join(workspace, SERVICES_DIR, fileName);
	mkdirSync(serviceDir, { recursive: true });
	writeFileSync(
		join(serviceDir, `${fileName}.model.ts`),
		`export interface ${className}Model {\n  id: string;\n  descripcion: string;\n}\n`
	);
	writeFileSync(
		join(serviceDir, `${fileName}.service.ts`),
		`import { Observable, of } from 'rxjs';\n` +
			`import { ${className}Model } from './${fileName}.model';\n\n` +
			`export class ${className}Service {\n` +
			`  get${className}(): Observable<{ datos: ${className}Model[] }> {\n` +
			`    return of({ datos: [] });\n  }\n}\n`
	);
}

// Opciones equivalentes al tsconfig strict que genera el Angular CLI.
function typecheck(workspace, rootFiles) {
	const program = ts.createProgram(rootFiles, {
		strict: true,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ES2022,
		moduleResolution: ts.ModuleResolutionKind.Node10,
		noImplicitOverride: true,
		noPropertyAccessFromIndexSignature: true,
		noImplicitReturns: true,
		noFallthroughCasesInSwitch: true,
		useDefineForClassFields: false,
		types: [],
	});
	const diagnostics = ts.getPreEmitDiagnostics(program);
	return ts.formatDiagnostics(diagnostics, {
		getCanonicalFileName: (fileName) => fileName,
		getCurrentDirectory: () => workspace,
		getNewLine: () => '\n',
	});
}

describe('state schematic', () => {
	it('genera los cuatro archivos en <path>/<nombre-dasherizado>', async () => {
		const tree = await generate({ name: 'ordenCompra', path: 'src/app/features/state' });
		assert.deepEqual(
			[...tree.files].sort(),
			GENERATED_KINDS.map((kind) => `/src/app/features/state/orden-compra/orden-compra.${kind}.ts`)
		);
	});

	it('usa src/app/core/state como path por defecto', async () => {
		const tree = await generate({ name: 'producto' });
		assert.ok(tree.exists('/src/app/core/state/producto/producto.reducer.ts'));
	});

	describe('validación de opciones', () => {
		for (const name of ['1producto', 'orden compra', 'orden--compra', 'producto-', '../producto', '']) {
			it(`rechaza el nombre con formato inválido ${JSON.stringify(name)}`, async () => {
				await assert.rejects(generate({ name }), /must match pattern/);
			});
		}

		for (const name of ['class', 'Delete', 'yield']) {
			it(`rechaza la palabra reservada "${name}"`, async () => {
				await assert.rejects(generate({ name }), /palabra reservada/);
			});
		}

		for (const name of ['state', 'adapter']) {
			it(`rechaza "${name}" porque choca con el código generado`, async () => {
				await assert.rejects(generate({ name }), /choca con identificadores/);
			});
		}

		for (const path of ['../fuera', 'src/../../fuera', '/..', '..\\fuera']) {
			it(`rechaza el path fuera del workspace ${JSON.stringify(path)}`, async () => {
				await assert.rejects(generate({ name: 'producto', path }), /fuera del workspace/);
			});
		}

		it('rechaza rutas absolutas del sistema', async () => {
			await assert.rejects(generate({ name: 'producto', path: 'C:\\proyecto\\src' }), /ruta absoluta/);
		});

		it('acepta un path con / inicial como relativo al workspace', async () => {
			const tree = await generate({ name: 'producto', path: '/src/app/state' });
			assert.ok(tree.exists('/src/app/state/producto/producto.actions.ts'));
		});
	});

	describe('el código generado compila contra NgRx', () => {
		const tmpRoot = join(repoRoot, '.tmp');
		mkdirSync(tmpRoot, { recursive: true });
		const workspace = mkdtempSync(join(tmpRoot, 'ws-'));
		after(() => rmSync(workspace, { recursive: true, force: true }));

		const cases = [
			{ name: 'producto' },
			{ name: 'orden-compra' },
			{ name: 'detalle_pedido' },
			{ name: 'usuarioRol' },
			{ name: 'Cliente', path: 'src/app/features/ventas/state' },
			{ name: 'linea-factura', path: './src/app/features/facturacion/' },
			{ name: 'remito', path: 'src\\app\\features\\logistica' },
			{ name: 'deposito', path: 'src/app/core/services/deposito' },
		];

		it(cases.map((c) => c.name).join(', '), async () => {
			const rootFiles = [];
			for (const options of cases) {
				const tree = await generate(options);
				for (const file of tree.files) {
					const target = join(workspace, file);
					mkdirSync(dirname(target), { recursive: true });
					writeFileSync(target, tree.readContent(file));
					rootFiles.push(target);
				}
				writeServiceStubs(workspace, options.name);
			}
			assert.equal(typecheck(workspace, rootFiles), '');
		});
	});
});
