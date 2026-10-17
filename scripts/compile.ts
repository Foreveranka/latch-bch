import { compileFile } from "cashc";
import { writeFileSync } from "node:fs";
const artifact = compileFile(
  new URL("../contracts/Latch.cash", import.meta.url).pathname,
);
writeFileSync(
  new URL("../src/artifact.json", import.meta.url),
  JSON.stringify(artifact, null, 2) + "\n",
);
console.log(
  `Compiled ${artifact.contractName}: ${artifact.bytecode.length / 2} encoded bytes`,
);
