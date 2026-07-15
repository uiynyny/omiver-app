async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey", "deriveBits"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptName(plainText: string, keyStr: string): Promise<string> {
  if (!plainText) return "";
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(keyStr, salt);
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(plainText)
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `client_enc:${saltHex}:${ivHex}:${cipherHex}`;
}

export async function decryptName(formattedString: string, keyStr: string): Promise<string> {
  if (!formattedString) return "";
  if (!formattedString.startsWith("client_enc:")) return formattedString;

  const parts = formattedString.split(":");
  if (parts.length !== 4) {
    return "[Locked]";
  }

  const saltHex = parts[1];
  const ivHex = parts[2];
  const cipherHex = parts[3];

  try {
    const saltBytes = saltHex.match(/.{1,2}/g);
    const ivBytes = ivHex.match(/.{1,2}/g);
    const cipherBytes = cipherHex.match(/.{1,2}/g);
    
    if (!saltBytes || !ivBytes || !cipherBytes) {
      return "[Locked]";
    }

    const salt = new Uint8Array(saltBytes.map(byte => parseInt(byte, 16)));
    const iv = new Uint8Array(ivBytes.map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(cipherBytes.map(byte => parseInt(byte, 16)));

    const key = await deriveKey(keyStr, salt);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (e) {
    return "[Locked]";
  }
}
