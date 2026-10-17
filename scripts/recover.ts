import { readFileSync } from "node:fs";
import { SignatureTemplate } from "cashscript";
import {
  validatePayment,
  makeContract,
  providerFor,
  settlementBuilder,
  pubkeyAddress,
  formatBch,
  FEE,
} from "../src/core";
// Read a dedicated local JSON key file; never put private keys in shell arguments.
const [recordPath, keyPath, action = "inspect", outpoint] =
  process.argv.slice(2);
if (!recordPath)
  throw new Error(
    "Usage: npx tsx scripts/recover.ts record.json [local-key.json] [inspect|claim|refund] [txid:vout] [--broadcast]",
  );
const p = validatePayment(JSON.parse(readFileSync(recordPath, "utf8"))),
  provider = providerFor(p.network),
  contract = makeContract(p, provider);
const height = await provider.getBlockHeight();
const outputs = (await contract.getUtxos()).filter((u) => !u.token);
console.log(
  JSON.stringify(
    {
      network: p.network,
      contract: contract.address,
      height,
      refundHeight: p.refundHeight,
      outputs: outputs.map((u) => ({ ...u, satoshis: u.satoshis.toString() })),
    },
    null,
    2,
  ),
);
if (action === "inspect") process.exit(0);
if (!["claim", "refund"].includes(action)) throw new Error("Unknown action.");
if (!keyPath) throw new Error("Local key JSON file required.");
const key = JSON.parse(readFileSync(keyPath, "utf8"));
const signer = new SignatureTemplate(key.privateKeyHex);
const refund = action === "refund";
if (refund && height < p.refundHeight) throw new Error("Refund not mature.");
const chosen = outpoint
  ? outputs.find((u) => `${u.txid}:${u.vout}` === outpoint)
  : outputs.length === 1
    ? outputs[0]
    : undefined;
if (!chosen)
  throw new Error("Specify an exact txid:vout when multiple outputs exist.");
const builder = settlementBuilder(
  p,
  chosen,
  provider,
  signer.publicKey,
  refund,
  signer,
);
const hex = builder.build();
console.log(
  JSON.stringify(
    {
      action,
      network: p.network,
      destination: pubkeyAddress(signer.publicKey, p.network),
      receivedBch: formatBch(chosen.satoshis - FEE),
      minerFeeSats: FEE.toString(),
      signedTransactionHex: hex,
      broadcast: process.argv.includes("--broadcast"),
    },
    null,
    2,
  ),
);
if (process.argv.includes("--broadcast"))
  console.log(JSON.stringify({ txid: await provider.sendRawTransaction(hex) }));
