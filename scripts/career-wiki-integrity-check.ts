import { runCareerIntegrityCheck } from "../src/lib/career-wiki/ops/integrity-check.ts";

const result = await runCareerIntegrityCheck();
console.log(JSON.stringify(result, null, 2));
if (result.status === "fail") process.exitCode = 1;
