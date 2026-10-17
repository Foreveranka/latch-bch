# Latch

Recipient-bound Bitcoin Cash payments with a refund path for unclaimed funds.

**Pre-hackathon prototype, built 17 October 2026. Registered as a hacker; project not submitted to BCH BLAZE.**

Live: https://latch-bch.vercel.app · Interactive local-VM demo: https://latch-bch.vercel.app/demo

## Product

Create a descriptor containing a sender, recipient, refund block, unique ID and BCH amount. Export it, fund its unique CashScript contract, and share the descriptor. The recipient signs a claim. The sender may refund an unspent output after the refund block.

**Refund maturity enables a second spend path. It does not cancel the recipient's claim.** The first valid spend accepted by the network wins; broadcasts can conflict and chains can reorganize.

- Root `/`: introductory landing, with an explicit entry button.
- `/app`: Chipnet or Mainnet payment records, wallet funding, claim, refund and export/import.
- `/demo`: signed funding + claim/refund transactions executed against the local BCH VM. Clearly labeled simulation; no invented explorer proofs.
- `/docs`: operation, security boundaries, recovery and build status.
- `/pitch`: web pitch with a download of the seven-slide official Widget Factory template adapted to Latch.

## Run

Node 22+ and a modern browser with top-level await, WebAssembly and WebSocket support.

```sh
npm ci
npm run compile
npm test
npm run build
npm run dev
```

## Contract properties

`contracts/Latch.cash`, compiled using `cashc 0.14.0`.

- One UTXO input and one payout output per settlement.
- Recipient signature claims to recipient; sender signature refunds to sender after `refundHeight`.
- No admin, custody or upgrade key.
- Maximum on-chain miner fee 1,000 satoshis; app chooses 800.
- Unique nonzero payment ID prevents accidental address reuse.
- Native BCH only. CashTokens sent to the contract cannot be recovered by this covenant. The app excludes token-bearing funding inputs and warns against token deposits.
- Pilot descriptor amount: 10,000 to 10,000,000 satoshis (0.0001–0.1 BCH). The amount cap is an application safeguard, not a covenant limit.

## WizardConnect

Uses the official `@wizardconnect/core` and `@wizardconnect/dapp` packages (LGPL-3.0-or-later; linked unmodified). The dapp requests a signature with `broadcast:false`, validates the returned transaction, then broadcasts through the chosen network provider. It uses the selected receive-address index only; change-address scanning is not implemented. Mainnet/Chipnet selection must match the wallet. Ordinary EVM WalletConnect cannot be substituted.

The encrypted relay session stays in memory. HD public keys can reveal wallet activity; connect only a dedicated wallet. The app never requests a seed or private key.

## Storage and independent recovery

No database or custody backend. Records live in browser localStorage, exported JSON and the public metadata fragment of a shared URL. Export **before funding**. The fragment does not contain private keys; sharing reveals addresses, amounts and labels.

Recover without the hosted app:

```sh
npx tsx scripts/recover.ts record.json
npx tsx scripts/recover.ts record.json /absolute/path/to/local-key.json refund TXID:VOUT
# Inspect the output first. Only add --broadcast when ready to spend.
```

The local key file format is `{ "privateKeyHex": "..." }`. Keep it outside the repo, mode 0600. Never paste keys into CLI arguments or browser forms. Multiple deposits are spent individually using an exact outpoint.

## Verification status — 17 October 2026

- 18 automated tests passed, including actual local BCH VM signature execution.
- Claim, refund maturity, backdated refund, wrong signer, fixed destination, fee drain, extra output and double spend tested.
- Browser demo exercises local funding and both settlement paths.
- **Pending:** funded Mainnet end-to-end proof, real third-party wallet end-to-end signature test, independent security review.
- **Pending:** BLAZE submission opening, required in-event improvements, participation roll call and Telegram confirmation, final in-event presentation updates.

A link being visible, an unsigned descriptor, a local VM transaction ID and a broadcast response are not evidence of a confirmed mainnet transaction. Confirmations should be inspected in a block explorer.

## Sources and competition

See `submission/RESEARCH.md` and `submission/CHECKLIST.md` for researched alternatives, sources, date discrepancy and exact eligibility state. No uniqueness, traction, revenue or prize claims are made.

MIT for original code. Third-party dependencies retain their licenses; see `THIRD_PARTY.md`.
