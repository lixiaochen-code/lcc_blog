import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRBACSeedSnapshot } from "./auth.js";

const snapshot = createRBACSeedSnapshot();
const outputPath = resolve(process.cwd(), "prisma", "rbac-seed.snapshot.json");

writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));

console.log(`RBAC seed snapshot written to ${outputPath}`);
