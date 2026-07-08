import { runCareerHealthcheck } from "../src/lib/career-wiki/ops/health.ts";

const result = await runCareerHealthcheck();
console.log(JSON.stringify(result, null, 2));
if (result.status === "fail") process.exitCode = 1;
