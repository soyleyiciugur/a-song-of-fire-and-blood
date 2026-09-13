import { createECDH } from "node:crypto";
const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
console.log(`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=${ecdh.getPublicKey().toString("base64url")}`);
console.log(`WEB_PUSH_VAPID_PRIVATE_KEY=${ecdh.getPrivateKey().toString("base64url")}`);
console.log("WEB_PUSH_VAPID_SUBJECT=mailto:YOUR_EMAIL@example.com");
