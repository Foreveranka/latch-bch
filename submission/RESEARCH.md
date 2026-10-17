# BCH BLAZE product research — 17 October 2026

## Primary sources checked

- https://dorahacks.io/hackathon/bchblaze2026/detail — Chrome-visible eligibility, judging and submission status.
- https://bchblaze.com/ — schedule and overall awards.
- https://bchblaze.com/bounties/ — bridge and XO bounties, including IP waiver.
- https://bchblaze.com/archive/ — 2025 examples: covenant portfolio rebalancing, FortressVault, IPFS and execution services.
- https://paymenthub.paytaca.com/ — existing invoices and subscription payments.
- https://www.paytaca.com/applications/pos — existing merchant POS.
- https://flipstarter.cash/ — existing non-custodial fundraising.
- https://stamps.cash/ — BCH gift/stamp product, linked by BLAZE.
- https://cashtokens.org/ — native token infrastructure.
- https://cashscript.org/docs/ — compiler and transaction SDK.
- https://docs.riftenlabs.com/wizardconnect/dapp/ — actual BCH wallet protocol and signing requests.

## Alternatives considered

1. Another generic POS/payment link: fast to ship, but Paytaca already provides it.
2. Cross-chain stablecoin bridge: explicit bounty fit, but liquidity, two-chain coordination and verification produce a much larger risk/scope. A decorative bridge would be misleading.
3. Goal-based crowdfunding: Flipstarter already exists; multi-contributor refund and target accounting need careful covenant design.
4. Freelancer milestone marketplace: a genuine workflow, but introduces delivery disputes, mediator incentives and a two-sided acquisition problem.
5. Latch: fixed-recipient payments with a sender refund path. Small, verifiable covenant and a clear two-outcome demo. Chosen for a usable prototype and testable boundaries.

Latch overlaps with existing timelock and gift-payment primitives. We do not claim a novel cryptographic construction or an exhaustive competitor survey. Product emphasis: recipient binding, explicit refund maturity/race semantics, recoverable public descriptors, transparent local VM demos and a clean team-payout interface.

## Important limitation discovered

A script cannot infer an absolute upper-bound claim expiry just because a transaction includes a locktime. Claim stays possible after refund maturity until the UTXO is spent. Latch therefore advertises refundable unclaimed payments, not guaranteed cancellation. Block-based refunds are tested with the mock provider's consensus validation; time-based mocks do not validate wall-clock maturity.

## Competition timing

DoraHacks shows Submit Build disabled, starts in 27 days. Sidebar: submission 13 Nov 16:00; deadline 21 Nov 16:00 (UI timezone unspecified). Body and organizer website: build/submission 14–22 Nov; organizer final 22 Nov 14:00 UTC. These conflict; use the earlier deadline operationally until the organizer clarifies. Do not fake an early submission or in-event creation.

This prototype is pre-existing work. Retain dated source and demo baseline, then implement substantial new work in the build window. Participation attendance and Telegram reality confirmation cannot truthfully be checked off yet.

## Bounty decision

No bounty selected. Latch does not implement a stablecoin bridge or XO template. Sponsor bounty rules include an IP waiver; the human-written XO feedback requirement also cannot be filled by an agent. Do not silently submit to these tracks.
