import {
  Contract,
  ElectrumNetworkProvider,
  MockNetworkProvider,
  Network,
  TransactionBuilder,
  SignatureTemplate,
  placeholderSignature,
  placeholderP2PKHUnlocker,
  type NetworkProvider,
  type SpendableUtxo,
  type Artifact,
} from "cashscript";
import {
  binToHex,
  hexToBin,
  decodeCashAddress,
  encodeCashAddress,
  hash160,
  hashTransaction,
  decodeTransaction,
  encodeTransaction,
  cashAddressToLockingBytecode,
} from "@bitauth/libauth";
import artifact from "./artifact.json";
export type Chain = "mainnet" | "chipnet";
export interface Payment {
  v: 1;
  id: string;
  label: string;
  sender: string;
  recipient: string;
  amount: string;
  refundHeight: number;
  network: Chain;
  createdAt: string;
  fundingTx?: string;
  settlementTx?: string;
}
export const FEE = 800n;
export const MIN_AMOUNT = 10000n;
export const MAX_AMOUNT = 10000000n; // pilot cap: 0.1 BCH, explicitly shown in UI
export const short = (s: string) =>
  s.length > 24 ? s.slice(0, 16) + "…" + s.slice(-8) : s;
export function parseAmount(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(value.trim()))
    throw new Error("Enter BCH with no more than 8 decimals.");
  const [whole, frac = ""] = value.trim().split(".");
  const sats = BigInt(whole) * 100000000n + BigInt(frac.padEnd(8, "0"));
  if (sats < MIN_AMOUNT || sats > MAX_AMOUNT)
    throw new Error("Pilot transfers must be between 0.0001 and 0.1 BCH.");
  return sats;
}
export function formatBch(value: bigint | string) {
  const n = BigInt(value);
  return `${n / 100000000n}.${(n % 100000000n).toString().padStart(8, "0")}`
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}
export function addressHash(address: string, network: Chain): Uint8Array {
  const d = decodeCashAddress(address.trim());
  if (typeof d === "string")
    throw new Error(
      "Invalid CashAddr address. Include the bitcoincash: or bchtest: prefix.",
    );
  if (d.prefix !== (network === "mainnet" ? "bitcoincash" : "bchtest"))
    throw new Error("The address belongs to a different network.");
  if (d.type !== "p2pkh" || d.payload.length !== 20)
    throw new Error(
      "Use a standard P2PKH wallet address. Contract and token addresses are not supported.",
    );
  return d.payload;
}
export function pubkeyAddress(pubkey: Uint8Array, network: Chain): string {
  return encodeCashAddress({
    prefix: network === "mainnet" ? "bitcoincash" : "bchtest",
    type: "p2pkh",
    payload: hash160(pubkey),
  }).address;
}
export function providerFor(network: Chain): NetworkProvider {
  return new ElectrumNetworkProvider(
    network === "mainnet" ? Network.MAINNET : Network.CHIPNET,
  );
}
export function validatePayment(value: unknown): Payment {
  if (!value || typeof value !== "object")
    throw new Error("Invalid payment record.");
  const p = value as Payment;
  if (p.v !== 1 || !/^[0-9a-f]{64}$/.test(p.id) || /^0+$/.test(p.id))
    throw new Error("Invalid payment identifier.");
  if (p.network !== "mainnet" && p.network !== "chipnet")
    throw new Error("Unsupported network.");
  if (typeof p.label !== "string" || p.label.length < 1 || p.label.length > 80)
    throw new Error("Payment label must be 1–80 characters.");
  addressHash(p.sender, p.network);
  addressHash(p.recipient, p.network);
  if (
    binToHex(addressHash(p.sender, p.network)) ===
    binToHex(addressHash(p.recipient, p.network))
  )
    throw new Error("Sender and recipient must be different.");
  if (
    !/^\d+$/.test(p.amount) ||
    BigInt(p.amount) < MIN_AMOUNT ||
    BigInt(p.amount) > MAX_AMOUNT
  )
    throw new Error("Amount exceeds pilot limits.");
  if (
    !Number.isSafeInteger(p.refundHeight) ||
    p.refundHeight < 1 ||
    p.refundHeight >= 500000000
  )
    throw new Error("Invalid refund block.");
  if (
    typeof p.createdAt !== "string" ||
    !Number.isFinite(Date.parse(p.createdAt))
  )
    throw new Error("Invalid creation date.");
  for (const tx of [p.fundingTx, p.settlementTx])
    if (tx !== undefined && !/^[a-f0-9]{64}$/.test(tx))
      throw new Error("Invalid transaction ID.");
  return {
    v: 1,
    id: p.id,
    label: p.label,
    sender: encodeCashAddress({
      prefix: p.network === "mainnet" ? "bitcoincash" : "bchtest",
      type: "p2pkh",
      payload: addressHash(p.sender, p.network),
    }).address,
    recipient: encodeCashAddress({
      prefix: p.network === "mainnet" ? "bitcoincash" : "bchtest",
      type: "p2pkh",
      payload: addressHash(p.recipient, p.network),
    }).address,
    amount: p.amount,
    refundHeight: p.refundHeight,
    network: p.network,
    createdAt: p.createdAt,
    ...(p.fundingTx ? { fundingTx: p.fundingTx } : {}),
    ...(p.settlementTx ? { settlementTx: p.settlementTx } : {}),
  };
}
export function makeContract(
  p: Payment,
  provider: NetworkProvider = providerFor(p.network),
) {
  validatePayment(p);
  return new Contract(
    artifact as Artifact,
    [
      addressHash(p.sender, p.network),
      addressHash(p.recipient, p.network),
      BigInt(p.refundHeight),
      hexToBin(p.id),
    ],
    { provider },
  );
}
export function packPayment(p: Payment) {
  const bytes = new TextEncoder().encode(JSON.stringify(validatePayment(p)));
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export function unpackPayment(encoded: string) {
  if (encoded.length > 6000) throw new Error("Payment link is too large.");
  const s = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"));
  return validatePayment(
    JSON.parse(
      new TextDecoder().decode(Uint8Array.from(s, (c) => c.charCodeAt(0))),
    ),
  );
}
export function explorer(network: Chain, tx: string) {
  return network === "mainnet"
    ? `https://blockchair.com/bitcoin-cash/transaction/${tx}`
    : `https://chipnet.chaingraph.cash/tx/${tx}`;
}
export function settlementBuilder(
  p: Payment,
  utxo: SpendableUtxo,
  provider: NetworkProvider,
  pubkey: Uint8Array,
  refund: boolean,
  signature: SignatureTemplate | Uint8Array = placeholderSignature(),
) {
  const expected = addressHash(refund ? p.sender : p.recipient, p.network);
  if (binToHex(hash160(pubkey)) !== binToHex(expected))
    throw new Error(
      refund
        ? "Only the sender can request this refund."
        : "Only the named recipient can claim.",
    );
  const contract = makeContract(p, provider);
  if (utxo.token) throw new Error("Token UTXOs are not supported.");
  if (utxo.lockingBytecode !== contract.lockingBytecode) {
    const lock = cashAddressToLockingBytecode(contract.address);
    if (
      typeof lock === "string" ||
      utxo.lockingBytecode !== binToHex(lock.bytecode)
    )
      throw new Error("UTXO does not belong to this payment.");
  }
  if (utxo.satoshis <= FEE + 546n)
    throw new Error("Not enough BCH to cover fee and dust.");
  return new TransactionBuilder({ provider, maximumFeeSatoshis: 1000n })
    .addInput(utxo, contract.unlock.spend(pubkey, signature, refund))
    .addOutput({
      to: refund ? p.sender : p.recipient,
      amount: utxo.satoshis - FEE,
    })
    .setLocktime(refund ? p.refundHeight : 0);
}
export function fundingBuilder(
  p: Payment,
  utxos: SpendableUtxo[],
  provider: NetworkProvider,
) {
  const wanted = BigInt(p.amount),
    selected: SpendableUtxo[] = [];
  let total = 0n;
  for (const u of utxos
    .filter((u) => !u.token)
    .sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1))) {
    selected.push(u);
    total += u.satoshis;
    if (total >= wanted + 1000n) break;
  }
  if (selected.length > 20)
    throw new Error(
      "Too many small inputs. Consolidate BCH in your wallet first.",
    );
  if (total < wanted + 1000n)
    throw new Error(
      "Insufficient BCH in the connected receive address. Keep at least 1,000 extra satoshis for fees.",
    );
  const contract = makeContract(p, provider),
    unlock = placeholderP2PKHUnlocker(p.sender);
  const builder = new TransactionBuilder({
    provider,
    maximumFeeSatoshis: 10000n,
  })
    .addInputs(selected, unlock)
    .addOutput({ to: contract.address, amount: wanted })
    .addBchChangeOutputIfNeeded({ to: p.sender, feeRate: 1.2 });
  return { builder, inputCount: selected.length };
}
export function checkedTransaction(
  hex: string,
  p: Payment,
  kind: "fund" | "claim" | "refund",
  expectedUtxo?: SpendableUtxo,
) {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2)
    throw new Error("Wallet returned invalid transaction bytes.");
  const tx = decodeTransaction(hexToBin(hex));
  if (typeof tx === "string")
    throw new Error("Cannot decode wallet transaction.");
  const target =
    kind === "fund"
      ? makeContract(p, new MockNetworkProvider()).address
      : kind === "refund"
        ? p.sender
        : p.recipient;
  // Mock providers use bchtest addresses; output bytecode is network independent.
  const lock = cashAddressToLockingBytecode(target);
  if (typeof lock === "string")
    throw new Error("Cannot derive payment output.");
  const matches = tx.outputs.filter(
    (o) => binToHex(o.lockingBytecode) === binToHex(lock.bytecode) && !o.token,
  );
  if (kind === "fund") {
    if (matches.length !== 1 || matches[0].valueSatoshis !== BigInt(p.amount))
      throw new Error("Signed transaction does not fund the agreed payment.");
  } else {
    if (
      !expectedUtxo ||
      tx.inputs.length !== 1 ||
      tx.outputs.length !== 1 ||
      matches.length !== 1 ||
      matches[0].valueSatoshis !== expectedUtxo.satoshis - FEE
    )
      throw new Error("Settlement output or fee differs from the preview.");
    const inp = tx.inputs[0];
    if (
      binToHex(inp.outpointTransactionHash) !== expectedUtxo.txid ||
      inp.outpointIndex !== expectedUtxo.vout
    )
      throw new Error("Settlement spends a different payment.");
    if (kind === "refund" && tx.locktime < p.refundHeight)
      throw new Error("Refund transaction is not time-locked correctly.");
  }
  return hashTransaction(hexToBin(hex));
}

export function verifySignedShape(
  hex: string,
  expected: import("cashscript").WcTransactionObject,
) {
  if (!/^[a-f0-9]+$/i.test(hex) || hex.length % 2)
    throw new Error("Wallet returned invalid transaction hex.");
  const tx = decodeTransaction(hexToBin(hex));
  if (typeof tx === "string")
    throw new Error("Cannot decode wallet transaction.");
  const original = expected.transaction;
  if (tx.inputs.length !== original.inputs.length)
    throw new Error("Wallet changed the transaction inputs.");
  const restored = {
    ...tx,
    inputs: tx.inputs.map((input, i) => ({
      ...input,
      unlockingBytecode: original.inputs[i].unlockingBytecode,
    })),
  };
  if (
    binToHex(encodeTransaction(restored)) !==
    binToHex(encodeTransaction(original))
  )
    throw new Error(
      "Wallet changed the reviewed transaction. Nothing was broadcast.",
    );
}
