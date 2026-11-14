import esbuild from "esbuild";
import { readFile } from "node:fs/promises";
import { commonBuildOptions, preservedModuleBuildOptions, runBuildContexts, sourceFiles } from "./esbuild.library.mjs";

const manifest = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const exports = Object.entries(manifest.exports).filter(([name]) => name === "./core" || name.startsWith("./core/"));
const contexts = [await esbuild.context(preservedModuleBuildOptions({
  entryPoints: await sourceFiles("src/core"),
}))];

for (const [, entry] of exports) {
  contexts.push(await esbuild.context(commonBuildOptions({
    entryPoints: [entry.types.replace("./dist/", "src/").replace(/\.d\.ts$/, ".ts")],
    bundle: true,
    packages: "external",
    format: "cjs",
    outfile: entry.require,
  })));
}

await runBuildContexts(contexts);
