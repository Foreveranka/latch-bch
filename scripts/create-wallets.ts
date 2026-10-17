import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { SignatureTemplate } from "cashscript";
import { encodeCashAddress, hash160, binToHex } from "@bitauth/libauth";
import { pubkeyAddress } from "../src/core";
const dir = "/Users/mete/Documents/Yarisma-Cuzdanlari/latch-bch";
mkdirSync(dir, { recursive: true, mode: 0o700 });
for (const purpose of [
  "mainnet-validation",
  "prize-receive",
  "chipnet-validation",
]) {
  const file = `${dir}/${purpose}.json`;
  if (existsSync(file)) continue;
  const key = randomBytes(32),
    signer = new SignatureTemplate(key);
  const network = purpose === "chipnet-validation" ? "chipnet" : "mainnet";
  const address = pubkeyAddress(signer.publicKey, network);
  const tokenAddress = encodeCashAddress({
    prefix: network === "mainnet" ? "bitcoincash" : "bchtest",
    type: "p2pkhWithTokens",
    payload: hash160(signer.publicKey),
  }).address;
  writeFileSync(
    file,
    JSON.stringify(
      { purpose, network, address, tokenAddress, privateKeyHex: binToHex(key) },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  appendFileSync(
    "/Users/mete/Documents/Yarisma-Cuzdanlari/CUZDANLAR.md",
    `\n- Latch / BCH BLAZE 2026 — ${purpose}; **${network === "mainnet" ? "MAINNET, gerçek ağ" : "CHIPNET, test ağı"}**, ${purpose === "prize-receive" ? "ödül alım cüzdanı" : "teknik doğrulama cüzdanı, ödül cüzdanı değil"}; Bitcoin Cash (${network}, EVM chain ID yok). Adres: \`${address}\`; CashTokens alım adresi: \`${tokenAddress}\`; 2026-10-17 yerelde üretilen anahtardan türetilerek doğrulandı, ağda fonlandığı henüz doğrulanmadı. Yerel anahtar dosyası: \`${file}\` (0600; repo dışında).\n`,
  );
  console.log(JSON.stringify({ purpose, network, address, tokenAddress }));
}
