import {
  MockNetworkProvider,
  SignatureTemplate,
  TransactionBuilder,
} from "cashscript";
import { hash160, binToHex, sha256, utf8ToBin } from "@bitauth/libauth";
import {
  makeContract,
  pubkeyAddress,
  settlementBuilder,
  type Payment,
} from "./core";
// Public, disposable fixture keys. They are never used on mainnet or chipnet.
export function fixtureKey(n: number) {
  const key = new Uint8Array(32);
  key[31] = n;
  return new SignatureTemplate(key);
}
export async function runDemo(refund = false) {
  const provider = new MockNetworkProvider();
  provider.setBlockHeight(refund ? 900150 : 900000);
  const sender = fixtureKey(1),
    recipient = fixtureKey(2);
  const p: Payment = {
    v: 1,
    id: binToHex(
      sha256.hash(
        utf8ToBin(refund ? "latch-refund-fixture" : "latch-claim-fixture"),
      ),
    ),
    label: refund ? "Unclaimed contractor payment" : "A thank-you, delivered",
    sender: pubkeyAddress(sender.publicKey, "chipnet"),
    recipient: pubkeyAddress(recipient.publicKey, "chipnet"),
    amount: "2500000",
    refundHeight: 900144,
    network: "chipnet",
    createdAt: "2026-10-17T00:00:00.000Z",
  };
  const input = provider.addUtxo(p.sender, {
    txid: "11".repeat(32),
    vout: 0,
    satoshis: 3000000n,
  });
  const contract = makeContract(p, provider);
  const funding = await new TransactionBuilder({ provider })
    .addInput(input, sender.unlockP2PKH())
    .addOutput({ to: contract.address, amount: 2500000n })
    .addOutput({ to: p.sender, amount: 499200n })
    .send();
  const [utxo] = await contract.getUtxos();
  const actor = refund ? sender : recipient;
  const settlement = await settlementBuilder(
    p,
    utxo,
    provider,
    actor.publicKey,
    refund,
    actor,
  ).send();
  const out = await provider.getUtxos(refund ? p.sender : p.recipient);
  return {
    payment: p,
    address: contract.address,
    fundingTx: funding.txid,
    settlementTx: settlement.txid,
    settlementHex: settlement.hex,
    received:
      out.reduce((a, u) => a + u.satoshis, 0n) - (refund ? 499200n : 0n),
    refund,
    vm: "BCH virtual machine — local mock network",
  };
}
