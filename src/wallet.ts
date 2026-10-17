import { DappConnectionManager } from "@wizardconnect/dapp";
import { initiateDappRelay, type DappRelayResult } from "@wizardconnect/core";
import { type WcTransactionObject } from "cashscript";
import { verifySignedShape } from "./core";
export interface WalletStatus {
  ready: boolean;
  name: string;
  uri: string;
  relay: string;
  pubkey?: Uint8Array;
  index: number;
}
export class WalletSession {
  manager: DappConnectionManager;
  relay?: DappRelayResult;
  status: WalletStatus = {
    ready: false,
    name: "",
    uri: "",
    relay: "Not connected",
    index: 0,
  };
  listeners = new Set<(s: WalletStatus) => void>();
  constructor() {
    this.manager = new DappConnectionManager(
      "Latch",
      `${location.origin}/icon.svg`,
      { session: false },
    );
    this.manager.on("walletready", () => {
      this.status = {
        ...this.status,
        ready: true,
        name: this.manager.walletName || "BCH wallet",
        pubkey: this.manager.getPubkey(0, BigInt(this.status.index)),
      };
      this.emit();
    });
    this.manager.on("disconnect", () => {
      this.status = {
        ...this.status,
        ready: false,
        pubkey: undefined,
        relay: "Disconnected",
      };
      this.emit();
    });
  }
  emit() {
    for (const fn of this.listeners) fn({ ...this.status });
  }
  connect() {
    if (this.relay) {
      this.emit();
      return;
    }
    this.relay = initiateDappRelay((payload) => {
      this.manager.updateConnection(payload.client, payload.status);
      this.status = { ...this.status, relay: payload.status.status };
      this.emit();
    });
    this.manager.attachRelay(this.relay);
    this.status = { ...this.status, uri: this.relay.uri };
    this.emit();
  }
  setIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index > 10000)
      throw new Error("Address index must be 0–10,000.");
    this.status = {
      ...this.status,
      index,
      pubkey: this.manager.getPubkey(0, BigInt(index)),
    };
    this.emit();
  }
  async sign(request: WcTransactionObject, inputCount: number) {
    if (!this.status.ready)
      throw new Error("Connect a WizardConnect-compatible wallet first.");
    const response = await this.manager.signTransaction(
      {
        transaction: { ...request, broadcast: false },
        inputPaths: Array.from(
          { length: inputCount },
          (_, i) =>
            [i, "receive", this.status.index] as [number, string, number],
        ),
      },
      { signal: AbortSignal.timeout(120000) },
    );
    if (response.error) throw new Error(response.error);
    if (!response.signedTransaction)
      throw new Error("Wallet did not return a signed transaction.");
    verifySignedShape(response.signedTransaction, request);
    return response.signedTransaction;
  }
  async disconnect() {
    this.manager.clearStoredSession();
    try {
      await this.manager.sendDisconnect("Disconnected by user");
    } finally {
      this.relay?.cleanup();
      this.relay = undefined;
      this.status = {
        ready: false,
        name: "",
        uri: "",
        relay: "Not connected",
        index: 0,
      };
      this.emit();
    }
  }
}
