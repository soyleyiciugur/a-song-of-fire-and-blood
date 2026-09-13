import { createECDH, createPrivateKey, hkdfSync, randomBytes, sign } from "node:crypto";

function fromBase64Url(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
function toBase64Url(value: Uint8Array | Buffer) {
  return Buffer.from(value).toString("base64url");
}
function uint32(value: number) {
  const buffer = Buffer.alloc(4); buffer.writeUInt32BE(value); return buffer;
}

function vapidAuthorization(endpoint: string) {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT || "mailto:admin@asofab.app";
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured.");

  const publicBytes = fromBase64Url(publicKey);
  if (publicBytes.length !== 65 || publicBytes[0] !== 4) throw new Error("Invalid VAPID public key.");
  const x = publicBytes.subarray(1, 33), y = publicBytes.subarray(33, 65), d = fromBase64Url(privateKey);
  const key = createPrivateKey({ key: { kty: "EC", crv: "P-256", x: toBase64Url(x), y: toBase64Url(y), d: toBase64Url(d) }, format: "jwk" });
  const audience = new URL(endpoint).origin;
  const header = toBase64Url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = toBase64Url(Buffer.from(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: subject })));
  const unsigned = `${header}.${payload}`;
  const signature = sign("sha256", Buffer.from(unsigned), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${unsigned}.${toBase64Url(signature)}, k=${publicKey}`;
}

export async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: unknown) {
  const uaPublic = fromBase64Url(subscription.p256dh);
  const authSecret = fromBase64Url(subscription.auth);
  const server = createECDH("prime256v1");
  server.generateKeys();
  const serverPublic = server.getPublicKey();
  const sharedSecret = server.computeSecret(uaPublic);
  const info = Buffer.concat([Buffer.from("WebPush: info\0", "utf8"), uaPublic, serverPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, info, 32));
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));

  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload), "utf8"), Buffer.from([2])]);
  const { createCipheriv } = await import("node:crypto");
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const recordSize = 4096;
  const body = Buffer.concat([salt, uint32(recordSize), Buffer.from([serverPublic.length]), serverPublic, ciphertext]);

  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: vapidAuthorization(subscription.endpoint),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body,
  });
}
