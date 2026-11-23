const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => new Uint8Array(hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
const toBase64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));

export async function computeSHA256(input: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return `0x${toHex(new Uint8Array(digest))}`;
}

export async function encryptMedicalPayload(
  title: string,
  clinicalNotes: string,
  encryptionKeyHex: string
): Promise<{ cipherText: string; authenticationTag: string; sha256Hash: string; ivHex: string }> {
  if (!/^[a-fA-F0-9]{64}$/.test(encryptionKeyHex)) throw new Error('AES-256 key must be exactly 32 bytes encoded as 64 hex characters');
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto is unavailable');
  const key = await globalThis.crypto.subtle.importKey('raw', fromHex(encryptionKeyHex), 'AES-GCM', false, ['encrypt']);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify({ title, clinicalNotes, timestamp: Date.now() }));
  const encrypted = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, plaintext));
  const tagStart = encrypted.length - 16;
  return {
    cipherText: toBase64(encrypted.slice(0, tagStart)),
    authenticationTag: toHex(encrypted.slice(tagStart)),
    sha256Hash: await computeSHA256(new TextDecoder().decode(plaintext)),
    ivHex: toHex(iv)
  };
}
