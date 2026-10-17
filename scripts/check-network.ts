import { providerFor } from "../src/core";
const results = await Promise.allSettled(
  (["mainnet", "chipnet"] as const).map(async (network) => {
    const provider = providerFor(network);
    return {
      network,
      height: await provider.getBlockHeight(),
      technicalBalance: (
        await provider.getUtxos(
          network === "mainnet"
            ? "bitcoincash:qpa4nmpqjfv3x2j49mdjxzhr756pshccucfhht8jhf"
            : "bchtest:qqykfugrzx7hpp2d4ctt22w8aansvgvrm5dwkg3c2t",
        )
      )
        .reduce((s, u) => s + u.satoshis, 0n)
        .toString(),
    };
  }),
);
console.log(
  JSON.stringify(results, (_, v) => (v instanceof Error ? v.message : v), 2),
);
process.exit(0);
