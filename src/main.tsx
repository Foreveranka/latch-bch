import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpLeft,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Layers3,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
  X,
  Download,
  Globe,
  Undo2,
  AlertCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { binToHex } from "@bitauth/libauth";
import type { SpendableUtxo } from "cashscript";
import {
  addressHash,
  checkedTransaction,
  explorer,
  FEE,
  formatBch,
  fundingBuilder,
  makeContract,
  packPayment,
  parseAmount,
  providerFor,
  pubkeyAddress,
  settlementBuilder,
  short,
  unpackPayment,
  validatePayment,
  type Chain,
  type Payment,
} from "./core";
import { runDemo } from "./demo";
import { WalletSession, type WalletStatus } from "./wallet";
import "./style.css";
const PRIZE = "bitcoincash:zqg6rqenxm32yavyxw7vehz0elkjuz7a9qdp86zwcs";
const REPO = "https://github.com/Foreveranka/latch-bch";
const wallet = new WalletSession();
function useWallet() {
  const [s, set] = useState(wallet.status);
  useEffect(() => {
    wallet.listeners.add(set);
    return () => {
      wallet.listeners.delete(set);
    };
  }, []);
  return s;
}
function IconMark() {
  return (
    <span className="mark">
      <span />
    </span>
  );
}
function Brand() {
  return (
    <a className="brand" href="/">
      <IconMark />
      latch<span className="brand-dot">.</span>
    </a>
  );
}
function Pill({
  children,
  green = false,
}: {
  children: React.ReactNode;
  green?: boolean;
}) {
  return <span className={"pill " + (green ? "green" : "")}>{children}</span>;
}
function download(name: string, data: string) {
  const u = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}
async function copy(s: string) {
  await navigator.clipboard.writeText(s);
}
function Footer() {
  return (
    <footer>
      <Brand />
      <span>Built for real-world Bitcoin Cash payments.</span>
      <a href="/docs">
        How it works <ArrowUpRight size={15} />
      </a>
      <a href={REPO} target="_blank" rel="noreferrer">
        Open source <ArrowUpRight size={15} />
      </a>
    </footer>
  );
}
function EventBanner() {
  return (
    <div className="event-banner">
      <span>
        <i /> BCH BLAZE 2026 · pre-hackathon prototype, 17 Oct
      </span>
      <div>
        <a href="/pitch">Pitch ↗</a>
        <a href={REPO}>Source ↗</a>
        <button title={PRIZE} onClick={() => copy(PRIZE)}>
          EMBER address <Copy size={11} />
        </button>
      </div>
    </div>
  );
}
function Header({ onConnect, w }: { onConnect: () => void; w: WalletStatus }) {
  return (
    <>
      <EventBanner />
      <header>
        <Brand />
        <nav>
          <a href="/#how">How it works</a>
          <a href="/docs">Documentation</a>
          <a href="/demo">Interactive demo</a>
        </nav>
        <button className="btn dark small" onClick={onConnect}>
          <Wallet size={16} />
          {w.ready ? w.name : "Connect wallet"}
        </button>
      </header>
    </>
  );
}
function WalletModal({ close, w }: { close: () => void; w: WalletStatus }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    wallet.connect();
  }, []);
  useEffect(() => {
    if (w.uri) QRCode.toDataURL(w.uri, { width: 240, margin: 1 }).then(setQr);
  }, [w.uri]);
  return (
    <div className="overlay" onClick={close}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Connect a BCH wallet"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close"
          aria-label="Close wallet dialog"
          onClick={close}
        >
          <X />
        </button>
        <div className="eyebrow">YOUR KEYS STAY WITH YOU</div>
        <h2>{w.ready ? "Wallet connected" : "Connect a BCH wallet"}</h2>
        {w.ready ? (
          <>
            <p>
              {w.name} · receive address index {w.index}
            </p>
            <label>
              Receive address index
              <input
                type="number"
                min="0"
                max="10000"
                value={w.index}
                onChange={(e) => wallet.setIndex(Number(e.target.value))}
              />
            </label>
            <p className="muted">
              The app reads and spends the selected receive address only. Change
              the index if your funds are at another address.
            </p>
            <button className="btn" onClick={() => wallet.disconnect()}>
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p>
              Scan this QR from a WizardConnect-compatible wallet. Ordinary
              WalletConnect and EVM wallets use a different protocol.
            </p>
            {qr ? (
              <img
                className="qr"
                src={qr}
                alt="WizardConnect pairing QR code"
              />
            ) : (
              <div className="qr-loading">Preparing encrypted connection…</div>
            )}
            <p className="relay">Relay: {w.relay}</p>
            <button
              className="btn full"
              disabled={!w.uri}
              onClick={() => copy(w.uri)}
            >
              Copy connection URI <Copy size={15} />
            </button>
            <p className="fine">
              This session is kept in memory and ends when you close the page.
              No seed phrases or private keys are requested.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
function Landing() {
  return (
    <>
      <main className="landing">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <i /> MONEY WITH A WAY BACK
            </div>
            <h1>
              Send it.
              <br />
              Let them claim it.
              <br />
              <em>Or bring it back.</em>
            </h1>
            <p>
              A better handoff for your Bitcoin Cash. Lock a payment to one
              recipient, set a refund block, and recover funds that stay
              unclaimed.
            </p>
            <div className="actions">
              <a className="btn dark" href="/app">
                Create a payment <ArrowUpRight size={19} />
              </a>
              <a className="text-link" href="/demo">
                Try it without a wallet <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-notes">
              <span>
                <ShieldCheck size={16} /> Wallet-signed
              </span>
              <span>
                <LockKeyhole size={15} /> Recipient-bound
              </span>
              <span>
                <Globe size={15} /> Native BCH
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-chip">
              <span className="tiny-dot" /> A CLEAR NEXT STEP
            </div>
            <div className="payment-preview">
              <div className="preview-top">
                <IconMark />
                <Pill green>Illustrative payment</Pill>
              </div>
              <p className="muted">Ready for the right person</p>
              <div className="big-amount">
                0.025<span>BCH</span>
              </div>
              <div className="preview-person">
                <div className="avatar">A</div>
                <div>
                  <b>Alex’s project payment</b>
                  <small>Only Alex’s wallet can claim</small>
                </div>
                <Check size={18} />
              </div>
              <div className="route-line">
                <span className="route-dot" />
                <span />
                <LockKeyhole size={18} />
                <span />
                <span className="route-dot green-dot" />
              </div>
              <div className="preview-grid">
                <div>
                  <small>Recipient</small>
                  <b>Claim with wallet</b>
                </div>
                <div>
                  <small>If unclaimed</small>
                  <b>Refund after block</b>
                </div>
              </div>
              <div className="preview-bottom">
                <Clock3 size={16} />
                <span>One payment. Two clear outcomes.</span>
                <ArrowUpRight size={17} />
              </div>
            </div>
            <div className="return-chip">
              <Undo2 size={20} />
              <div>
                <b>Still unclaimed?</b>
                <small>Bring it back when refund opens.</small>
              </div>
            </div>
            <span className="art-caption">
              YOUR MONEY DOESN’T NEED A DEAD END.
            </span>
          </div>
        </section>
        <section className="benefit-strip">
          <div>
            <span>01</span>
            <b>For one recipient</b>
            <p>A forwarded link can’t redirect the payment.</p>
          </div>
          <div>
            <span>02</span>
            <b>A visible refund path</b>
            <p>Know when unclaimed BCH becomes recoverable.</p>
          </div>
          <div>
            <span>03</span>
            <b>Controlled by your wallet</b>
            <p>Every movement requires the right signature.</p>
          </div>
        </section>
        <section id="how" className="how-section">
          <div>
            <div className="eyebrow">LESS GUESSWORK. MORE CONTROL.</div>
            <h2>
              A handoff,
              <br />
              with the rules built in.
            </h2>
            <p>
              Useful for contractor payouts, community rewards and payments that
              need to reach a specific wallet.
            </p>
            <a className="text-link" href="/docs">
              Understand the contract <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="steps">
            {[
              [
                "Create the payment",
                "Choose the sender, the recipient, an amount and a refund block.",
              ],
              [
                "Fund and share",
                "Your wallet funds a unique contract. Send the payment record to your recipient.",
              ],
              [
                "Claim or recover",
                "The recipient signs to claim. After maturity, the sender can refund an unspent payment.",
              ],
            ].map(([t, d], i) => (
              <div className="step" key={t}>
                <span>{i + 1}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="honesty-note">
          <ShieldCheck />
          <div>
            <b>A refund opening is not an automatic cancellation.</b>
            <p>
              The recipient can still claim until the payment is spent. After
              the refund block, claim and refund can compete. No transaction is
              sent automatically.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
function loadRecords(): Payment[] {
  try {
    const r = JSON.parse(localStorage.getItem("latch-records-v1") || "[]");
    return Array.isArray(r) ? r.map(validatePayment) : [];
  } catch {
    return [];
  }
}
function PaymentApp({
  w,
  onConnect,
}: {
  w: WalletStatus;
  onConnect: () => void;
}) {
  const [network, setNetwork] = useState<Chain>("chipnet"),
    [tab, setTab] = useState("new"),
    [records, setRecords] = useState<Payment[]>(loadRecords),
    [selected, setSelected] = useState<Payment>(),
    [sender, setSender] = useState(""),
    [recipient, setRecipient] = useState(""),
    [amount, setAmount] = useState("0.001"),
    [label, setLabel] = useState(""),
    [blocks, setBlocks] = useState("144"),
    [height, setHeight] = useState<number>(),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [utxos, setUtxos] = useState<SpendableUtxo[] | null>(null),
    [qr, setQr] = useState("");
  const connected = w.pubkey ? pubkeyAddress(w.pubkey, network) : "";
  const save = (p: Payment) => {
    setRecords((old) => {
      const next = [p, ...old.filter((x) => x.id !== p.id)];
      localStorage.setItem("latch-records-v1", JSON.stringify(next));
      return next;
    });
    setSelected(p);
  };
  const attempt = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
    } finally {
      setBusy("");
    }
  };
  useEffect(() => {
    if (connected) setSender(connected);
  }, [connected]);
  useEffect(() => {
    if (location.hash.startsWith("#p=")) {
      try {
        const p = unpackPayment(location.hash.slice(3));
        save(p);
        setNetwork(p.network);
        setTab("record");
      } catch (e) {
        setError((e as Error).message);
      }
    }
  }, []);
  useEffect(() => {
    setHeight(undefined);
    setUtxos(null);
  }, [network]);
  useEffect(() => {
    if (selected) {
      const c = makeContract(selected);
      QRCode.toDataURL(`${c.address}?amount=${formatBch(selected.amount)}`, {
        width: 190,
        margin: 1,
      }).then(setQr);
    }
  }, [selected]);
  const refresh = async () => {
    const provider = providerFor(selected?.network || network);
    const h = await provider.getBlockHeight();
    setHeight(h);
    if (selected) setUtxos(await makeContract(selected, provider).getUtxos());
    setNotice(
      "Live chain response received. Unspent outputs can include unconfirmed transactions.",
    );
  };
  const create = async () => {
    addressHash(sender, network);
    addressHash(recipient, network);
    const sats = parseAmount(amount);
    const b = Number(blocks);
    if (!Number.isInteger(b) || b < 1 || b > 4320)
      throw new Error("Choose between 1 and 4,320 blocks.");
    const h = await providerFor(network).getBlockHeight();
    setHeight(h);
    const id = binToHex(crypto.getRandomValues(new Uint8Array(32)));
    const p = validatePayment({
      v: 1,
      id,
      label: label.trim() || "Untitled payment",
      sender: sender.trim(),
      recipient: recipient.trim(),
      amount: sats.toString(),
      refundHeight: h + b,
      network,
      createdAt: new Date().toISOString(),
    });
    save(p);
    setTab("record");
    setUtxos(null);
    setNotice(
      "Payment record created. No funds have moved. Back up the record before funding.",
    );
  };
  const fund = async () => {
    if (!selected) return;
    if (!w.ready || !w.pubkey) throw new Error("Connect your wallet first.");
    const addr = pubkeyAddress(w.pubkey, selected.network);
    if (addr !== selected.sender)
      throw new Error(
        "Connect the sender’s wallet at the correct address index.",
      );
    const provider = providerFor(selected.network);
    const current = await makeContract(selected, provider).getUtxos();
    if (current.some((u) => !u.token))
      throw new Error(
        "This payment already has funds. Create a new payment instead of funding twice.",
      );
    if ((await provider.getBlockHeight()) >= selected.refundHeight)
      throw new Error("Refund block has arrived. Create a fresh payment.");
    const { builder, inputCount } = fundingBuilder(
      selected,
      await provider.getUtxos(addr),
      provider,
    );
    const hex = await wallet.sign(
      builder.generateWcTransactionObject({
        broadcast: false,
        userPrompt: `Latch ${selected.network}: lock ${formatBch(selected.amount)} BCH for ${selected.recipient}; refund block ${selected.refundHeight}`,
      }),
      inputCount,
    );
    const txid = checkedTransaction(hex, selected, "fund");
    const sent = await provider.sendRawTransaction(hex);
    if (sent !== txid)
      throw new Error(
        "Broadcast returned an unexpected transaction ID. Verify in explorer.",
      );
    save({ ...selected, fundingTx: txid });
    setNotice("Funding broadcast. Check the explorer for block confirmations.");
    setUtxos(await makeContract(selected, provider).getUtxos());
  };
  const settle = async (refund: boolean) => {
    if (!selected || !w.pubkey)
      throw new Error("Connect the matching wallet first.");
    const provider = providerFor(selected.network),
      h = await provider.getBlockHeight();
    setHeight(h);
    if (refund && h < selected.refundHeight)
      throw new Error(
        `Refund opens at block ${selected.refundHeight}. Current block: ${h}.`,
      );
    const available = (
      await makeContract(selected, provider).getUtxos()
    ).filter((u) => !u.token);
    if (available.length !== 1)
      throw new Error(
        available.length
          ? "Multiple funding outputs detected. Export the record and use the per-UTXO recovery script."
          : "No unspent BCH was found. Refresh and inspect the funding transaction.",
      );
    const u = available[0];
    const builder = settlementBuilder(selected, u, provider, w.pubkey, refund);
    const hex = await wallet.sign(
      builder.generateWcTransactionObject({
        broadcast: false,
        userPrompt: `Latch ${selected.network}: ${refund ? "refund to sender" : "claim to recipient"} ${formatBch(u.satoshis - FEE)} BCH; miner fee ${FEE} satoshis`,
      }),
      1,
    );
    const txid = checkedTransaction(
      hex,
      selected,
      refund ? "refund" : "claim",
      u,
    );
    const sent = await provider.sendRawTransaction(hex);
    if (sent !== txid)
      throw new Error("Unexpected broadcast response. Check explorer.");
    save({ ...selected, settlementTx: txid });
    setUtxos(await makeContract(selected, provider).getUtxos());
    setNotice(
      `${refund ? "Refund" : "Claim"} broadcast. Inclusion and confirmations must be checked in the explorer.`,
    );
  };
  const share = selected
    ? `${location.origin}/app#p=${packPayment(selected)}`
    : "";
  const balance = utxos
    ?.filter((u) => !u.token)
    .reduce((sum, u) => sum + u.satoshis, 0n);
  return (
    <div className="workspace">
      <aside>
        <div className="eyebrow">YOUR WORKSPACE</div>
        <button
          className={tab === "new" ? "active" : ""}
          onClick={() => {
            setTab("new");
            setSelected(undefined);
            setUtxos(null);
          }}
        >
          <Plus size={17} /> New payment
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          <Layers3 size={17} /> Payment records <small>{records.length}</small>
        </button>
        <a href="/demo">
          <FlaskConical size={17} /> Interactive demo
        </a>
        <a href="/docs">
          <FileText size={17} /> Documentation
        </a>
        <div className="aside-bottom">
          <ShieldCheck size={22} />
          <b>
            Wallets sign.
            <br />
            Contracts enforce.
          </b>
          <p>
            No platform balance.
            <br />
            No private key uploads.
          </p>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-title">
          <div>
            <div className="eyebrow">A CLEARER WAY TO PAY</div>
            <h1>
              {tab === "new"
                ? "Let’s make a handoff."
                : tab === "history"
                  ? "Your payment records."
                  : "Every detail, in the open."}
            </h1>
            <p>
              {tab === "new"
                ? "Set the recipient. Keep a path back."
                : tab === "history"
                  ? "Stored on this browser. Export records to back them up."
                  : "Check the contract before your wallet signs."}
            </p>
          </div>
          <label className="network-select">
            <span className="tiny-dot" />
            <select
              aria-label="Network"
              value={network}
              onChange={(e) => {
                setNetwork(e.target.value as Chain);
                setSelected(undefined);
                setTab("new");
                setRecipient("");
                setError("");
              }}
            >
              <option value="chipnet">Chipnet · test BCH</option>
              <option value="mainnet">Mainnet · real BCH</option>
            </select>
          </label>
        </div>
        {network === "mainnet" && (
          <div className="alert amber">
            <AlertCircle size={18} /> Mainnet uses real BCH. This is an
            unaudited pilot, capped at 0.1 BCH per payment. Only send an amount
            you can afford to put at risk.
          </div>
        )}
        {error && (
          <div role="alert" className="alert error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="alert">
            <Check size={18} />
            {notice}
          </div>
        )}
        {tab === "new" && (
          <div className="create-grid">
            <section className="panel form-panel">
              <div className="panel-title">
                <span className="icon-tile">
                  <Send size={20} />
                </span>
                <div>
                  <h2>New payment</h2>
                  <p>The right person, the right amount.</p>
                </div>
                <Pill>01 / CREATE</Pill>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  attempt("Creating record", create);
                }}
              >
                <label>
                  Payment label <span>Optional</span>
                  <input
                    maxLength={80}
                    placeholder="e.g. Design sprint · October"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </label>
                <label>
                  Sender’s refund address
                  <button type="button" className="inline" onClick={onConnect}>
                    {w.ready ? "Change wallet" : "Use connected wallet"}{" "}
                    <ArrowUpRight size={12} />
                  </button>
                  <input
                    required
                    placeholder={
                      network === "mainnet" ? "bitcoincash:q…" : "bchtest:q…"
                    }
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    readOnly={!!connected}
                  />
                </label>
                <label>
                  Recipient address
                  <input
                    required
                    placeholder={
                      network === "mainnet" ? "bitcoincash:q…" : "bchtest:q…"
                    }
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </label>
                <div className="two-fields">
                  <label>
                    Amount <span>BCH</span>
                    <input
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <label>
                    Refund opens after
                    <select
                      value={blocks}
                      onChange={(e) => setBlocks(e.target.value)}
                    >
                      <option value="6">6 blocks · ~1 hour</option>
                      <option value="144">144 blocks · ~1 day</option>
                      <option value="432">432 blocks · ~3 days</option>
                      <option value="1008">1,008 blocks · ~7 days</option>
                    </select>
                  </label>
                </div>
                <p className="fine">
                  Block estimates assume ~10 minutes per block; actual timing
                  varies. Minimum 0.0001 BCH, maximum 0.1 BCH.
                </p>
                <div className="form-summary">
                  <span>Platform fee</span>
                  <b>0 BCH during pilot</b>
                </div>
                <div className="form-summary">
                  <span>Network fees</span>
                  <b>Paid separately in BCH</b>
                </div>
                <button className="btn dark full" disabled={!!busy}>
                  {busy || "Create payment record"}
                  <ArrowRight size={18} />
                </button>
                <p className="fine center">
                  Creating a record does not move funds.
                </p>
              </form>
            </section>
            <div>
              <section className="panel explain-panel">
                <Pill green>
                  <LockKeyhole size={12} /> RECIPIENT-BOUND
                </Pill>
                <h2>
                  One destination.
                  <br />A way back.
                </h2>
                <div className="mini-flow">
                  <div>
                    <ArrowUpRight />
                    <b>You lock BCH</b>
                    <p>In a unique on-chain contract.</p>
                  </div>
                  <span />
                  <div>
                    <ArrowDownLeft />
                    <b>They claim it</b>
                    <p>Using their own wallet signature.</p>
                  </div>
                  <span />
                  <div>
                    <Undo2 />
                    <b>Or you recover it</b>
                    <p>After the refund block, while unspent.</p>
                  </div>
                </div>
                <div className="note">
                  A shared link carries payment details, not spending authority.
                  Only the matching wallet can sign.
                </div>
              </section>
              <a className="demo-callout" href="/demo">
                <FlaskConical />
                <div>
                  <b>Just exploring?</b>
                  <p>Run the claim and refund paths without a wallet.</p>
                </div>
                <ArrowUpRight />
              </a>
            </div>
          </div>
        )}
        {tab === "history" && (
          <section className="panel">
            <div className="panel-title">
              <h2>Saved on this browser</h2>
              <label className="btn small">
                Import record
                <input
                  aria-label="Import payment record"
                  type="file"
                  accept=".json,application/json"
                  hidden
                  onChange={(e) =>
                    attempt("Importing", async () => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 12000)
                        throw new Error("Record is too large.");
                      const p = validatePayment(JSON.parse(await file.text()));
                      save(p);
                      setNetwork(p.network);
                      setTab("record");
                    })
                  }
                />
              </label>
            </div>
            {records.length ? (
              records.map((p) => (
                <button
                  className="record-row"
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setNetwork(p.network);
                    setTab("record");
                    setUtxos(null);
                    setNotice("");
                  }}
                >
                  <span className="icon-tile">
                    <Send size={18} />
                  </span>
                  <div>
                    <b>{p.label}</b>
                    <small>{short(p.recipient)}</small>
                  </div>
                  <Pill>{p.network}</Pill>
                  <strong>{formatBch(p.amount)} BCH</strong>
                  <ChevronRight size={18} />
                </button>
              ))
            ) : (
              <div className="empty">
                <Layers3 size={32} />
                <h3>Your first payment starts here.</h3>
                <p>Create a record or import one shared by someone else.</p>
                <button className="btn dark" onClick={() => setTab("new")}>
                  Create a payment <Plus size={16} />
                </button>
              </div>
            )}
          </section>
        )}
        {tab === "record" && selected && (
          <div className="record-grid">
            <section className="panel">
              <div className="panel-title">
                <div>
                  <Pill green>{selected.network.toUpperCase()}</Pill>
                  <h2>{selected.label}</h2>
                </div>
                <button
                  aria-label="Refresh payment from blockchain"
                  className="btn small"
                  disabled={!!busy}
                  onClick={() => attempt("Refreshing", refresh)}
                >
                  <RefreshCw size={16} /> Refresh chain
                </button>
              </div>
              <div className="detail-amount">
                {formatBch(selected.amount)} <span>BCH</span>
              </div>
              <div className="status-box">
                <span className="tiny-dot" />
                <b>
                  {utxos === null
                    ? "Chain status not checked"
                    : balance && balance > 0n
                      ? "Unspent BCH detected"
                      : "No unspent BCH detected"}
                </b>
                <small>
                  {balance !== undefined
                    ? `${formatBch(balance)} BCH currently unspent`
                    : "Refresh to read the network. A record is not proof of funding."}
                </small>
              </div>
              <dl>
                <dt>Sender / refund destination</dt>
                <dd>{selected.sender}</dd>
                <dt>Recipient / claim destination</dt>
                <dd>{selected.recipient}</dd>
                <dt>Contract address · BCH only</dt>
                <dd>{makeContract(selected).address}</dd>
                <dt>Refund opens at block</dt>
                <dd>
                  #{selected.refundHeight.toLocaleString()}{" "}
                  {height !== undefined && (
                    <span className="muted">
                      · current #{height.toLocaleString()}
                    </span>
                  )}
                </dd>
                <dt>Settlement miner fee</dt>
                <dd>{FEE.toString()} satoshis per funded output</dd>
              </dl>
              <div className="record-buttons">
                <button
                  className="btn dark"
                  disabled={!!busy || !w.ready}
                  onClick={() => attempt("Funding", fund)}
                >
                  Fund with wallet <ArrowUpRight size={16} />
                </button>
                <button
                  className="btn"
                  disabled={!!busy || !w.ready}
                  onClick={() => attempt("Claiming", () => settle(false))}
                >
                  Claim as recipient <ArrowDownLeft size={16} />
                </button>
                <button
                  className="btn"
                  disabled={
                    !!busy ||
                    !w.ready ||
                    (height !== undefined && height < selected.refundHeight)
                  }
                  onClick={() => attempt("Refunding", () => settle(true))}
                >
                  Refund as sender <Undo2 size={16} />
                </button>
              </div>
              {!w.ready && (
                <button className="text-link" onClick={onConnect}>
                  Connect the matching wallet to transact{" "}
                  <ArrowRight size={15} />
                </button>
              )}
              {busy && <p role="status">{busy}…</p>}
              <p className="fine">
                Signing opens your wallet. Latch verifies the signed transaction
                before broadcasting it. Broadcast does not mean confirmed.
              </p>
              {selected.fundingTx && (
                <a
                  className="tx-link"
                  href={explorer(selected.network, selected.fundingTx)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Funding transaction: {short(selected.fundingTx)}{" "}
                  <ExternalLink size={14} />
                </a>
              )}
              {selected.settlementTx && (
                <a
                  className="tx-link"
                  href={explorer(selected.network, selected.settlementTx)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Settlement transaction: {short(selected.settlementTx)}{" "}
                  <ExternalLink size={14} />
                </a>
              )}
            </section>
            <div>
              <section className="panel share-panel">
                <h3>Keep the record. Share the handoff.</h3>
                <p>
                  Anyone can inspect it. Only the matching recipient can claim.
                </p>
                <button
                  className="btn full"
                  onClick={() =>
                    attempt("Copying", async () => {
                      await copy(share);
                      setNotice(
                        "Payment link copied. It contains public payment metadata.",
                      );
                    })
                  }
                >
                  Copy payment link <Copy size={16} />
                </button>
                <button
                  className="btn full"
                  onClick={() =>
                    download(
                      `latch-${selected.id.slice(0, 8)}.json`,
                      JSON.stringify(selected, null, 2),
                    )
                  }
                >
                  Export recovery record <Download size={16} />
                </button>
                <div className="note">
                  Export before funding. The record reconstructs the contract if
                  this website disappears. Labels and addresses in a shared link
                  are visible to its recipient.
                </div>
              </section>
              <section className="panel funding-qr">
                <h3>Fund from another wallet</h3>
                {qr && <img src={qr} alt="BCH funding request QR" />}
                <p>
                  Send exactly {formatBch(selected.amount)} BCH once. Use a
                  wallet supporting P2SH32. Never send CashTokens to this
                  contract.
                </p>
                <button
                  className="text-link"
                  onClick={() => copy(makeContract(selected).address)}
                >
                  Copy contract address <Copy size={14} />
                </button>
              </section>
            </div>
          </div>
        )}
        <div className="app-bottom-note">
          <ShieldCheck size={16} />
          <span>
            Refund maturity does not cancel the recipient’s claim. The first
            valid spend accepted by the chain wins.
          </span>
        </div>
      </main>
    </div>
  );
}
function Demo() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof runDemo>>>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function play(refund: boolean) {
    setBusy(true);
    setError("");
    try {
      setResult(await runDemo(refund));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="document demo-page">
      <div className="eyebrow">CLICK IT. SEE THE RULES WORK.</div>
      <h1>
        Try both sides
        <br />
        of the handoff.
      </h1>
      <p className="lead">
        Real signed transactions, evaluated by the Bitcoin Cash virtual machine
        in your browser. Local simulation only; no coins, faucet or wallet
        required.
      </p>
      <div className="demo-options">
        <button
          className="panel demo-option"
          onClick={() => play(false)}
          disabled={busy}
        >
          <ArrowDownLeft size={28} />
          <h2>The recipient claims</h2>
          <p>
            Fund a contract, sign as the named recipient and collect the BCH.
          </p>
          <span className="text-link">
            Run claim scenario <ArrowRight size={18} />
          </span>
        </button>
        <button
          className="panel demo-option"
          onClick={() => play(true)}
          disabled={busy}
        >
          <Undo2 size={28} />
          <h2>The sender recovers</h2>
          <p>
            Advance the simulated chain beyond the refund block and reclaim the
            unspent payment.
          </p>
          <span className="text-link">
            Run refund scenario <ArrowRight size={18} />
          </span>
        </button>
      </div>
      {busy && (
        <div className="alert" role="status">
          Executing transactions against the local BCH virtual machine…
        </div>
      )}
      {error && <div className="alert error">{error}</div>}
      {result && (
        <section className="panel demo-result" aria-live="polite">
          <div className="panel-title">
            <Pill green>
              <Check size={13} /> VM VALIDATION PASSED
            </Pill>
            <b>{result.refund ? "Sender refunded" : "Recipient paid"}</b>
          </div>
          <div className="detail-amount">
            {formatBch(result.received)} <span>BCH · simulated</span>
          </div>
          <p>0.025 BCH locked − 800 satoshis settlement fee.</p>
          <div className="demo-timeline">
            <div>
              <Check />
              <span>Funding transaction signed and validated</span>
            </div>
            <div>
              <Check />
              <span>
                {result.refund
                  ? "Refund block reached in simulated chain"
                  : "Recipient public key matched the contract"}
              </span>
            </div>
            <div>
              <Check />
              <span>Settlement signature and fixed destination verified</span>
            </div>
            <div>
              <Check />
              <span>Spent input removed; payout UTXO created</span>
            </div>
          </div>
          <dl>
            <dt>Local funding transaction ID</dt>
            <dd>{result.fundingTx}</dd>
            <dt>Local settlement transaction ID</dt>
            <dd>{result.settlementTx}</dd>
          </dl>
          <p className="fine">
            These IDs belong to this local simulation. They are not mainnet or
            chipnet explorer receipts.
          </p>
          <button
            className="btn"
            onClick={() =>
              download(
                "latch-local-vm-proof.json",
                JSON.stringify(
                  { ...result, received: result.received.toString() },
                  null,
                  2,
                ),
              )
            }
          >
            Download local proof <Download size={16} />
          </button>
        </section>
      )}
      <div className="honesty-note">
        <ShieldCheck />
        <div>
          <b>What this verifies</b>
          <p>
            Transaction signatures, the recipient restriction, the output amount
            and the contract’s refund condition. Network propagation, wallet
            compatibility and mainnet confirmations require separate live
            testing.
          </p>
        </div>
      </div>
      <a className="btn dark" href="/app">
        Open the payment app <ArrowUpRight size={18} />
      </a>
    </main>
  );
}
const sections = [
  ["overview", "What is Latch?"],
  ["lifecycle", "Payment lifecycle"],
  ["wallets", "Wallets and networks"],
  ["refunds", "Claims and refunds"],
  ["recovery", "Backup and recovery"],
  ["security", "Security boundaries"],
  ["business", "Business model"],
  ["readiness", "Build status"],
];
function Docs() {
  return (
    <div className="docs-layout">
      <aside>
        <div className="eyebrow">DOCUMENTATION</div>
        {sections.map(([id, t]) => (
          <a key={id} href={"#" + id}>
            {t}
          </a>
        ))}
      </aside>
      <main className="document">
        <div className="eyebrow">UNDERSTAND BEFORE YOU SEND</div>
        <h1>A clear set of rules.</h1>
        <section id="overview">
          <h2>What is Latch?</h2>
          <p>
            Latch creates recipient-bound, refundable BCH payments. A unique
            CashScript covenant fixes the sender, recipient and refund block.
            Latch does not hold keys, decide who may spend or run a custody
            balance.
          </p>
          <div className="doc-diagram">
            <span>Sender wallet</span>
            <ArrowRight />
            <b>Latch contract</b>
            <ArrowRight />
            <span>Recipient wallet</span>
          </div>
        </section>
        <section id="lifecycle">
          <h2>Payment lifecycle</h2>
          <ol>
            <li>Create a record: nothing is funded yet.</li>
            <li>
              Export the recovery JSON and verify the two wallet addresses.
            </li>
            <li>
              Fund the contract once with BCH. Wait for the confirmations you
              require.
            </li>
            <li>
              Share the record. The recipient signs the claim in their own
              wallet.
            </li>
            <li>
              If the payment stays unspent, the sender can sign a refund after
              the configured block.
            </li>
          </ol>
          <p>
            A network failure is shown as an error, never as a successful
            payment.
          </p>
        </section>
        <section id="wallets">
          <h2>Wallets and networks</h2>
          <p>
            WizardConnect connects an HD BCH wallet over an encrypted relay. It
            is a different protocol from EVM WalletConnect. The app uses the
            receive address index selected in the connection dialog. Funds on
            other receive or change addresses are not automatically selected.
          </p>
          <p>
            Chipnet uses test BCH and bchtest: addresses. Mainnet uses real BCH
            and bitcoincash: addresses. A bchtest: prefix alone does not
            distinguish chipnet from other BCH test networks: confirm Chipnet in
            your wallet. Only standard P2PKH sender/recipient addresses are
            accepted. Contract funding uses P2SH32.
          </p>
          <p>
            Bitcoin Cash is not an EVM network and has no EVM chain ID. The
            pilot moves native BCH only; it does not accept stablecoins or
            CashTokens.
          </p>
        </section>
        <section id="refunds">
          <h2>Claims and refunds</h2>
          <div className="doc-grid">
            <div>
              <ArrowDownLeft />
              <h3>Claim</h3>
              <p>
                Recipient signature → recipient address. Settlement fee: 800
                satoshis per UTXO.
              </p>
            </div>
            <div>
              <Undo2 />
              <h3>Refund</h3>
              <p>
                Sender signature + refund block reached → sender address.
                Settlement fee: 800 satoshis per UTXO.
              </p>
            </div>
          </div>
          <p>
            <strong>
              The refund block enables a second spend path. It does not expire
              the first one.
            </strong>{" "}
            The recipient can still claim until the output is spent. After
            maturity, a claim and refund can compete; mempool acceptance and
            eventual chain inclusion determine the outcome. A refund broadcast
            is not a guarantee against a competing claim or reorganisation.
          </p>
          <p>
            Block times are variable. “144 blocks ≈ one day” is only an
            estimate. Refunds are executed by a signed transaction; there is no
            automatic withdrawal or scheduler.
          </p>
        </section>
        <section id="recovery">
          <h2>Backup and recovery</h2>
          <p>
            Payment records live in your browser and in the link you share.
            Clearing site storage removes your local list. Export JSON before
            funding. The file contains public contract parameters and allows the
            open-source recovery script to reconstruct the contract without
            Latch hosting.
          </p>
          <p>
            If several outputs are funded to the same contract, they must be
            recovered separately. The web app stops on this condition rather
            than guessing which deposit to spend. Never send tokens to a
            BCH-only covenant: token inputs cannot be spent by this contract.
          </p>
        </section>
        <section id="security">
          <h2>Security boundaries</h2>
          <ul>
            <li>
              One input, one output, recipient fixed by the chosen branch.
            </li>
            <li>
              The contract caps miner fees at 1,000 satoshis. The app uses 800.
            </li>
            <li>
              No admin key, no upgrade key, no platform withdrawal function.
            </li>
            <li>
              Payment links reveal addresses, amounts and labels; BCH is a
              public ledger.
            </li>
            <li>
              The website is unaudited. Independent review and live wallet
              testing remain required.
            </li>
            <li>
              Local VM tests are not a substitute for mainnet evidence or a
              security audit.
            </li>
          </ul>
          <p>
            The application asks your wallet to sign without broadcasting,
            checks the returned transaction and broadcasts through the selected
            network provider. An untrusted or compromised wallet/site remains a
            risk.
          </p>
        </section>
        <section id="business">
          <h2>Business model</h2>
          <p>
            The pilot charges no platform fee. A future business could charge
            teams for payout tracking, accounting exports and integrations. This
            is a proposed model; there are no claims of existing customers,
            revenue or guaranteed savings.
          </p>
        </section>
        <section id="readiness">
          <h2>Build status and competition disclosure</h2>
          <p>
            This prototype was created on 17 October 2026, before BCH BLAZE’s
            November build period. It must be declared as pre-existing work. A
            dated baseline is retained in the source repository. Eligibility
            requires substantial in-event improvement, mainnet functionality, a
            working demo, the requested presentation format and participation
            requirements.
          </p>
          <p>
            Local signed claim and refund scenarios run in the browser. The
            automated suite currently contains 18 passing tests, including
            unauthorised spend, premature refund, destination redirection,
            excess fees and double spend. A funded mainnet end-to-end proof and
            a real external wallet signature test are still pending.
          </p>
          <p>
            <a href={REPO}>Source code and exact verification status ↗</a>
          </p>
        </section>
      </main>
    </div>
  );
}
function Pitch() {
  return (
    <main className="document">
      <div className="eyebrow">LATCH · PRODUCT PITCH</div>
      <h1>
        A way back for
        <br />
        unclaimed payments.
      </h1>
      <p className="lead">
        Recipient-bound BCH handoffs with a visible refund path.
      </p>
      {[
        [
          "01 · Problem",
          "A payout is not complete until the right person receives it. Teams need visibility and a recovery path when a recipient never claims.",
        ],
        [
          "02 · Product",
          "Create a payment, lock BCH to one recipient, share the record. The recipient claims with their signature. If it stays unspent, the sender can recover it after a block-height threshold.",
        ],
        [
          "03 · Why Bitcoin Cash",
          "Native BCH covenants enforce destination and fee limits. Small settlement fees make smaller payouts practical. WizardConnect keeps transaction signing in the user’s wallet.",
        ],
        [
          "04 · Differentiation",
          "A recipient address is part of the contract, not just text in a link. A forwarded link cannot change the beneficiary. Every transfer has an exportable recovery descriptor.",
        ],
        [
          "05 · Business",
          "Contractor and community payout workflows; future team tracking, accounting exports and API plans. Pilot: no platform fee. No fabricated traction.",
        ],
        [
          "06 · Demonstration",
          "The interactive demo executes signed claim and refund transactions against the local BCH VM. Real chain evidence is tracked separately and is still pending.",
        ],
        [
          "07 · Boundaries",
          "Recipient claims remain valid after refund maturity until spent. No automatic cancellation. Native BCH only. Unaudited pilot.",
        ],
        [
          "08 · BCH BLAZE disclosure",
          "Built 17 October 2026, before the build window. Baseline disclosed. This web pitch is a draft; the required Widget Factory presentation, attendance, Telegram confirmation and funded mainnet proof are still pending.",
        ],
      ].map(([h, p]) => (
        <section className="pitch-card" key={h}>
          <div className="eyebrow">{h}</div>
          <p>{p}</p>
        </section>
      ))}
      <a className="btn dark" href="/demo">
        Run the product demo <ArrowUpRight size={18} />
      </a>
    </main>
  );
}
function App() {
  const w = useWallet();
  const [modal, setModal] = useState(false);
  const path = location.pathname;
  return (
    <>
      <Header w={w} onConnect={() => setModal(true)} />
      {path === "/app" ? (
        <PaymentApp w={w} onConnect={() => setModal(true)} />
      ) : path === "/demo" ? (
        <>
          <Demo />
          <Footer />
        </>
      ) : path === "/docs" ? (
        <>
          <Docs />
          <Footer />
        </>
      ) : path === "/pitch" ? (
        <>
          <Pitch />
          <Footer />
        </>
      ) : (
        <Landing />
      )}
      {modal && <WalletModal w={w} close={() => setModal(false)} />}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
