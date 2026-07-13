import { runCareerBackup } from "../src/lib/career-wiki/ops/backup.ts";

const result = await runCareerBackup();
console.log(JSON.stringify(result, null, 2));
