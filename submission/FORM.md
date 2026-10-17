# Draft application fields — not submitted

**Title:** Latch — Recipient-bound, refundable BCH payments

**Tagline:** Send to the right wallet. Recover what stays unclaimed.

**Description:**
Latch gives Bitcoin Cash payouts a clear handoff and a visible way back. A sender creates a payment for one recipient and funds a unique CashScript covenant. The named recipient claims with a wallet signature. If the payment remains unspent after the refund block, the sender can recover it. Forwarding a payment link cannot redirect the beneficiary.

The web app includes an introductory landing, payment workspace, WizardConnect integration, record export/import, a recovery script and a wallet-free demo that executes real signed transactions against a local BCH virtual machine. Local simulations are explicitly distinguished from live network proofs. Native BCH only; no custody keys or admin withdrawals.

Refund maturity enables a refund path; it does not cancel a still-valid recipient claim. Competing spends are resolved by the network. This is an unaudited pilot, with no fabricated traction or mainnet claims.

**Pre-existing work disclosure:** Prototype built on 17 October 2026. Repository and live demo baseline predate the hackathon. In-event improvements and final mainnet evidence must be added before submission. Do not claim the initial prototype was built during the November event.

**Category:** Payments / Bitcoin Cash / Non-custodial tooling

**GitHub:** https://github.com/Foreveranka/latch-bch

**Website:** https://latch-bch.vercel.app

**Demo:** https://latch-bch.vercel.app/demo (local VM simulation, not live transaction evidence).

**Stack:** React, TypeScript, Vite, CashScript 0.14, Libauth, WizardConnect.

**Telegram:** foreveranka (user supplied in this conversation).

**Prize/EMBER CashTokens address:** bitcoincash:zqg6rqenxm32yavyxw7vehz0elkjuz7a9qdp86zwcs

**Attendance:** Pending; never attest attendance until Mete actually attends roll call.

**Final delivery state:** Pending submission opening and eligibility completion.
