import nextra from "nextra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "../..");

const withNextra = nextra({
  search: {
    codeblocks: false
  },
  defaultShowCopyCode: true
});

export default withNextra({
  reactStrictMode: true,
  transpilePackages: ["@lcc-blog/db", "@lcc-blog/shared"],
  turbopack: {
    root: workspaceRoot
  }
});
