// 產生 VAPID 金鑰：公鑰放進 wrangler.toml，私鑰（JWK）用 `wrangler secret put VAPID_PRIVATE_JWK` 存成機密
import { webcrypto as crypto } from 'node:crypto';
const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
const jwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
console.log(JSON.stringify({ publicKey: Buffer.from(raw).toString('base64url'), privateJwk: jwk }));
