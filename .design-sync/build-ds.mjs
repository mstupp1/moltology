#!/usr/bin/env node
// Builds the HUD primitives in src/components/ui into a self-contained mini
// package at .design-sync/.cache/pkg for the design-sync converter:
//   dist/index.js      ESM bundle (react / radix / lucide / marked left external)
//   dist/types/...     tsc declarations (the props contracts)
//   styles.css         compiled Tailwind + HUD CSS, scoped to what the DS uses
// Run from the repo root: node .design-sync/build-ds.mjs
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve('.')
const PKG = join(ROOT, '.design-sync/.cache/pkg')
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: ROOT })

rmSync(PKG, { recursive: true, force: true })
mkdirSync(join(PKG, 'dist'), { recursive: true })

// -- entry: the public ui barrel, minus app-auth wiring, plus the toast provider
// GuestLockGuard pulls in the auth session + AuthModal (live backend), so it is
// not a design primitive.
const barrel = readFileSync(join(ROOT, 'src/components/ui/index.ts'), 'utf8')
  .split('\n')
  .filter((l) => !l.includes('GuestLockGuard'))
  .join('\n')
  .replaceAll("from './", "from '../../../src/components/ui/")
const entrySrc = `${barrel}
export { ToastProvider, useToast, useOptionalToast } from '../../../src/components/ui/ToastProvider'
`
const entryDir = join(ROOT, '.design-sync/.cache/entry')
mkdirSync(entryDir, { recursive: true })
writeFileSync(join(entryDir, 'index.ts'), entrySrc)

// -- package.json
writeFileSync(join(PKG, 'package.json'), JSON.stringify({
  name: '@moltology/hud',
  version: JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version ?? '0.0.0',
  type: 'module',
  module: 'dist/index.js',
  types: 'dist/types/.design-sync/.cache/entry/index.d.ts',
  peerDependencies: { react: '*', 'react-dom': '*' },
}, null, 2))

// -- JS bundle
// The app serves a few brand images from its own /images route; designs have no
// such origin. Every one is mirrored on the public S3 bucket, so point
// root-relative /images paths (and getAssetUrl's local branch) there.
const S3 = 'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets'
const s3Assets = {
  name: 's3-assets',
  setup(b) {
    b.onLoad({ filter: /src\/(components\/ui\/[^/]+|lib\/assets)\.tsx?$/ }, (args) => {
      let code = readFileSync(args.path, 'utf8')
        .replace(/(['"`])\/images\//g, `$1${S3}/images/`)
        .replace('return `/${cleanPath}`', 'return `${S3_BASE_URL}/${cleanPath}`')
      return { contents: code, loader: args.path.endsWith('x') ? 'tsx' : 'ts' }
    })
  },
}
const esbuild = (await import(join(ROOT, 'node_modules/esbuild/lib/main.js'))).default
await esbuild.build({
  entryPoints: [join(entryDir, 'index.ts')],
  outfile: join(PKG, 'dist/index.js'),
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  target: 'es2020',
  alias: { '@': join(ROOT, 'src') },
  packages: 'external',
  loader: { '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
  plugins: [s3Assets],
})
// esbuild writes imported CSS (pbr-textures) next to the JS as index.css.

// -- declarations
const tsconfig = join(entryDir, 'tsconfig.dts.json')
writeFileSync(tsconfig, JSON.stringify({
  extends: '../../../tsconfig.json',
  compilerOptions: {
    noEmit: false, declaration: true, emitDeclarationOnly: true, incremental: false,
    rootDir: '../../..', outDir: '../pkg/dist/types', noEmitOnError: false, skipLibCheck: true,
  },
  include: [],
  files: ['index.ts'],
}, null, 2))
try { run(`npx tsc -p ${tsconfig}`) } catch { console.error('  (tsc reported type errors; declarations still emitted)') }

// -- CSS: repo Tailwind config, content narrowed to the DS + authored previews
const twConfig = join(entryDir, 'tailwind.ds.config.cjs')
writeFileSync(twConfig, `
const base = require(${JSON.stringify(join(ROOT, 'tailwind.config.js'))});
module.exports = { ...(base.default ?? base), content: [
  ${JSON.stringify(join(ROOT, 'src/components/ui/**/*.{ts,tsx}'))},
  ${JSON.stringify(join(ROOT, '.design-sync/previews/**/*.tsx'))},
],
  // Guaranteed vocabulary for the design agent's own layout glue: Tailwind is
  // JIT, so only these (plus whatever the DS itself uses) exist in the CSS.
  safelist: [
    { pattern: /^(bg|text|border)-(benthic|cyan|crimson|sacred)-(bg|dim|surface|container|high|border|outline|glow|bright|dark|muted|aggro|deep|red)$/ },
    { pattern: /^shadow-(hud-cyan|hud-cyan-lg|hud-red|hud-red-lg|sacred-red|chitin-plate)$/ },
    { pattern: /^font-(sans|grotesk|cinzel|garamond|normal|medium|semibold|bold|black)$/ },
    { pattern: /^(flex|inline-flex|grid|block|inline-block|hidden|flex-col|flex-row|flex-wrap|flex-1|shrink-0|grow|relative|absolute|fixed|sticky|inset-0|overflow-hidden|overflow-auto|truncate|uppercase|italic|text-center|text-left|text-right|rounded-none|border|border-t|border-b|border-l|border-r|w-full|h-full|min-h-screen|mx-auto)$/ },
    { pattern: /^(items|justify)-(start|center|end|between|stretch)$/ },
    { pattern: /^(grid-cols|col-span)-(1|2|3|4|6|12)$/ },
    { pattern: /^(gap|gap-x|gap-y|space-y|space-x|p|px|py|pt|pb|m|mx|my|mt|mb)-(0|1|2|3|4|5|6|8|10|12|16)$/ },
    { pattern: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose)$/ },
    { pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)$/ },
    { pattern: /^(tracking-(tight|normal|wide|wider|widest)|leading-(tight|snug|normal|relaxed))$/ },
  ],
};
`)
const cssIn = join(entryDir, 'input.css')
writeFileSync(cssIn, [
  readFileSync(join(ROOT, 'src/index.css'), 'utf8'),
  readFileSync(join(ROOT, 'src/styles/editorial-fonts.css'), 'utf8'),
].join('\n'))
run(`npx tailwindcss -c ${twConfig} -i ${cssIn} -o ${join(PKG, 'tw.css')}`)

// Fonts are served from /fonts in the app; ship the repo's public/ copies
// inside the package so the converter can bundle them.
cpSync(join(ROOT, 'public/fonts'), join(PKG, 'fonts'), { recursive: true })
const tw = readFileSync(join(PKG, 'tw.css'), 'utf8').replace(/url\(['"]?\/fonts\//g, "url('./fonts/")
let compiled = ''
try { compiled = readFileSync(join(PKG, 'dist/index.css'), 'utf8') } catch {}
writeFileSync(join(PKG, 'styles.css'), tw + '\n' + compiled)
rmSync(join(PKG, 'tw.css'))
console.log('built', PKG)
