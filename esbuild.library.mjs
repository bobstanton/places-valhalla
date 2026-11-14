import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";

export const prod = process.argv[2] === "production";
export const watchMode = process.argv[2] === "watch";

export async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = join(directory, entry.name);

    if (entry.isDirectory()) return sourceFiles(target);

    return entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") ? [target] : [];
  }));

  return nested.flat();
}

function emittedRelativeSpecifier(specifier, resolveDir) {
  const suffixIndex = specifier.search(/[?#]/);
  const sourcePath = suffixIndex === -1 ? specifier : specifier.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : specifier.slice(suffixIndex);
  const absolute = resolve(resolveDir, sourcePath);

  if (/\.(?:ts|tsx|mts|cts)$/.test(sourcePath)) {
    return sourcePath.replace(/\.(?:ts|tsx|mts|cts)$/, ".js") + suffix;
  }

  if (/\.js$/.test(sourcePath) && existsSync(absolute.replace(/\.js$/, ".ts"))) {
    return specifier;
  }

  if ([".ts", ".tsx", ".mts", ".cts"].some((extension) => existsSync(absolute + extension))) {
    return sourcePath + ".js" + suffix;
  }

  if (["index.ts", "index.tsx", "index.mts", "index.cts"].some((file) => existsSync(join(absolute, file)))) {
    return sourcePath.replace(/\/$/, "") + "/index.js" + suffix;
  }

  return undefined;
}

export const preserveRelativeEsmPlugin = {
  name: "preserve-relative-esm",
  setup(build) {
    build.onResolve({ filter: /^\.{1,2}\// }, (args) => {
      if (args.kind === "entry-point") return undefined;
      const emitted = emittedRelativeSpecifier(args.path, args.resolveDir);

      return emitted ? { path: emitted, external: true } : undefined;
    });
  },
};

export function commonBuildOptions(options = {}) {
  return {
    target: "es2022",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    ...options,
  };
}

export function preservedModuleBuildOptions(options = {}) {
  const { plugins = [], ...overrides } = options;

  return commonBuildOptions({
    bundle: true,
    format: "esm",
    packages: "external",
    outbase: "src",
    outdir: "dist",
    ...overrides,
    plugins: [preserveRelativeEsmPlugin, ...plugins],
  });
}

export async function runBuildContexts(contexts) {
  if (watchMode) {
    await Promise.all(contexts.map((context) => context.watch()));

    return;
  }

  await Promise.all(contexts.map((context) => context.rebuild()));

  await Promise.all(contexts.map((context) => context.dispose()));
}

export function hasBuiltExports() {
  const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
  const entries = Object.values(manifest.exports ?? {}).filter(entry => entry?.types);

  return entries.length > 0 && entries.every(entry =>
    ['types', 'import', 'require'].every(field => !entry[field] || existsSync(new URL(entry[field], import.meta.url))));
}
