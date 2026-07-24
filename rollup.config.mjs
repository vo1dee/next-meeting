import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";

const uuid = "com.vo1dee.next-meeting";

export default {
  input: "src/plugin.ts",
  output: {
    file: `${uuid}.sdPlugin/bin/plugin.js`,
    format: "es",
    sourcemap: false,
  },
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __PLUGIN_UUID__: JSON.stringify(uuid),
        // Empty in local/dev builds; set these two in the release-build shell
        // to bake real credentials into bin/plugin.js (gitignored — never committed).
        __GOOGLE_CLIENT_ID__: JSON.stringify(process.env.NM_GOOGLE_CLIENT_ID ?? ""),
        __GOOGLE_CLIENT_SECRET__: JSON.stringify(process.env.NM_GOOGLE_CLIENT_SECRET ?? ""),
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
