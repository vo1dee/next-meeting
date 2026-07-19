import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";

// One shared codebase, two Marketplace SKUs (ADR-0003). The Free/Pro boundary
// lives in the manifests; the bundles differ only in these injected constants.
const SKUS = {
  free: { uuid: "com.vo1dee.next-meeting", isPro: false },
  pro: { uuid: "com.vo1dee.next-meeting-pro", isPro: true },
};

const selected = process.env.SKU ? [process.env.SKU] : Object.keys(SKUS);

export default selected.map((name) => {
  const sku = SKUS[name];
  if (!sku) throw new Error(`Unknown SKU "${name}" — expected one of: ${Object.keys(SKUS).join(", ")}`);

  return {
    input: "src/plugin.ts",
    output: {
      file: `${sku.uuid}.sdPlugin/bin/plugin.js`,
      format: "es",
      sourcemap: false,
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          __PLUGIN_UUID__: JSON.stringify(sku.uuid),
          __IS_PRO__: JSON.stringify(sku.isPro),
        },
      }),
      typescript(),
      nodeResolve({ exportConditions: ["node"], preferBuiltins: true }),
      commonjs(),
      {
        // The Stream Deck app runs the bundle with its embedded Node 20; this
        // marks bin/ as ESM so `plugin.js` loads as a module.
        name: "emit-module-package-json",
        generateBundle() {
          this.emitFile({ type: "asset", fileName: "package.json", source: '{ "type": "module" }\n' });
        },
      },
    ],
  };
});
