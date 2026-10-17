import test from "node:test";
import assert from "node:assert/strict";
import { MockNetworkProvider, TransactionBuilder } from "cashscript";
import { binToHex, sha256, utf8ToBin } from "@bitauth/libauth";
import { fixtureKey, runDemo } from "../src/demo";
import {
  addressHash,
  parseAmount,
  packPayment,
  unpackPayment,
  makeContract,
  pubkeyAddress,
  settlementBuilder,
  validatePayment,
  FEE,
  checkedTransaction,
  type Payment,
} from "../src/core";
function setup(height = 900000) {
  const provider = new MockNetworkProvider();
  provider.setBlockHeight(height);
  const sender = fixtureKey(1),
    recipient = fixtureKey(2),
    attacker = fixtureKey(3);
  const p: Payment = {
    v: 1,
    id: binToHex(sha256.hash(utf8ToBin("test"))),
    label: "A real VM test",
    sender: pubkeyAddress(sender.publicKey, "chipnet"),
    recipient: pubkeyAddress(recipient.publicKey, "chipnet"),
    amount: "100000",
    refundHeight: 900144,
    network: "chipnet",
    createdAt: "2026-10-17T00:00:00Z",
  };
  const contract = makeContract(p, provider);
  const utxo = provider.addUtxo(contract.address, {
    txid: "aa".repeat(32),
    vout: 0,
    satoshis: 100000n,
  });
  return { provider, sender, recipient, attacker, p, contract, utxo };
}
test("exact BCH parsing and precision", () => {
  assert.equal(parseAmount("0.00100001"), 100001n);
  for (const bad of [
    "1e-3",
    "-1",
    "0.00000001",
    "0.10000001",
    "0.001000001",
    "NaN",
    "0x1",
  ])
    assert.throws(() => parseAmount(bad));
});
test("CashAddr checksum and network validation", () => {
  const { p } = setup();
  addressHash(p.sender, "chipnet");
  assert.throws(() => addressHash(p.sender, "mainnet"));
  assert.throws(() => addressHash(p.sender.slice(0, -1) + "x", "chipnet"));
});
test("portable descriptor preserves Unicode and strips unknown fields", () => {
  const { p } = setup();
  p.label = "Ödeme · İstanbul";
  assert.deepEqual(
    unpackPayment(packPayment({ ...p, extra: "removed" } as Payment)),
    p,
  );
});
test("rejects malformed and oversized records", () => {
  const { p } = setup();
  assert.throws(() => validatePayment({ ...p, refundHeight: 500000000 }));
  assert.throws(() => validatePayment({ ...p, id: "0".repeat(64) }));
  assert.throws(() => validatePayment({ ...p, recipient: p.sender }));
  assert.throws(() => unpackPayment("x".repeat(6001)));
});
test("unique payment ID changes contract address", () => {
  const { p, provider, contract } = setup();
  assert.notEqual(
    makeContract({ ...p, id: "bb".repeat(32) }, provider).address,
    contract.address,
  );
});
test("named recipient claims before refund maturity", async () => {
  const { p, provider, utxo, recipient } = setup();
  const tx = await settlementBuilder(
    p,
    utxo,
    provider,
    recipient.publicKey,
    false,
    recipient,
  ).send();
  assert.equal(
    (await provider.getUtxos(p.recipient))[0].satoshis,
    100000n - FEE,
  );
  assert.equal(checkedTransaction(tx.hex, p, "claim", utxo), tx.txid);
});
test("sender cannot claim as recipient", () => {
  const { p, provider, utxo, sender } = setup();
  assert.throws(() =>
    settlementBuilder(p, utxo, provider, sender.publicKey, false, sender),
  );
});
test("stranger is rejected by the actual BCH VM", async () => {
  const { provider, utxo, contract, attacker, p } = setup();
  const b = new TransactionBuilder({ provider })
    .addInput(utxo, contract.unlock.spend(attacker.publicKey, attacker, false))
    .addOutput({ to: p.recipient, amount: 99200n });
  await assert.rejects(() => b.send());
});
test("sender refund before block is rejected", async () => {
  const { p, provider, utxo, sender } = setup();
  await assert.rejects(() =>
    settlementBuilder(p, utxo, provider, sender.publicKey, true, sender).send(),
  );
});
test("refund with backdated locktime is rejected by script", async () => {
  const { p, provider, utxo, sender } = setup(900200);
  const b = settlementBuilder(
    p,
    utxo,
    provider,
    sender.publicKey,
    true,
    sender,
  ).setLocktime(900143);
  await assert.rejects(() => b.send());
});
test("sender refund after maturity succeeds", async () => {
  const { p, provider, utxo, sender } = setup(900145);
  await settlementBuilder(
    p,
    utxo,
    provider,
    sender.publicKey,
    true,
    sender,
  ).send();
  assert.equal((await provider.getUtxos(p.sender))[0].satoshis, 99200n);
});
test("claim remains possible after refund maturity (documented race)", async () => {
  const { p, provider, utxo, recipient } = setup(900145);
  await settlementBuilder(
    p,
    utxo,
    provider,
    recipient.publicKey,
    false,
    recipient,
  ).send();
  assert.equal((await provider.getUtxos(p.recipient)).length, 1);
});
test("cannot redirect payout", async () => {
  const { p, provider, utxo, contract, recipient, attacker } = setup();
  const b = new TransactionBuilder({ provider })
    .addInput(
      utxo,
      contract.unlock.spend(recipient.publicKey, recipient, false),
    )
    .addOutput({
      to: pubkeyAddress(attacker.publicKey, p.network),
      amount: 99200n,
    });
  await assert.rejects(() => b.send());
});
test("cannot drain value through inflated miner fee", async () => {
  const { p, provider, utxo, contract, recipient } = setup();
  const b = new TransactionBuilder({
    provider,
    maximumFeeSatoshis: 50000n,
    maximumFeeSatsPerByte: 200,
  })
    .addInput(
      utxo,
      contract.unlock.spend(recipient.publicKey, recipient, false),
    )
    .addOutput({ to: p.recipient, amount: 50000n });
  await assert.rejects(() => b.send());
});
test("cannot split an extra attacker output", async () => {
  const { p, provider, utxo, contract, recipient } = setup();
  const b = new TransactionBuilder({ provider })
    .addInput(
      utxo,
      contract.unlock.spend(recipient.publicKey, recipient, false),
    )
    .addOutput({ to: p.recipient, amount: 98000n })
    .addOutput({ to: p.sender, amount: 1200n });
  await assert.rejects(() => b.send());
});
test("spent UTXO cannot be claimed or refunded twice", async () => {
  const { p, provider, utxo, recipient, sender } = setup(900200);
  await settlementBuilder(
    p,
    utxo,
    provider,
    recipient.publicKey,
    false,
    recipient,
  ).send();
  await assert.rejects(() =>
    settlementBuilder(p, utxo, provider, sender.publicKey, true, sender).send(),
  );
});
test("both full demo paths execute signed transactions locally", async () => {
  for (const refund of [false, true]) {
    const r = await runDemo(refund);
    assert.equal(r.received, 2499200n);
    assert.match(r.settlementTx, /^[a-f0-9]{64}$/);
  }
});

test("signed wallet response cannot change reviewed outputs", async () => {
  const { p, provider, utxo, recipient } = setup();
  const builder = settlementBuilder(
    p,
    utxo,
    provider,
    recipient.publicKey,
    false,
    recipient,
  );
  const wc = builder.generateWcTransactionObject();
  const hex = builder.build();
  const { verifySignedShape } = await import("../src/core");
  verifySignedShape(hex, wc);
  const changed = {
    ...wc,
    transaction: {
      ...wc.transaction,
      outputs: wc.transaction.outputs.map((o, i) => ({
        ...o,
        valueSatoshis: o.valueSatoshis - 1n,
      })),
    },
  };
  assert.throws(() => verifySignedShape(hex, changed));
});
