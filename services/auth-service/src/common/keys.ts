import * as crypto from 'crypto';

let devPrivateKey: string | null = null;
let devPublicKey: string | null = null;

export function getJwtKeys() {
  const envPrivate = process.env.JWT_PRIVATE_KEY;
  const envPublic = process.env.JWT_PUBLIC_KEY;

  if (envPrivate && envPublic) {
    // Standard format substitution in case newlines were stripped
    return {
      privateKey: envPrivate.replace(/\\n/g, '\n'),
      publicKey: envPublic.replace(/\\n/g, '\n'),
    };
  }

  // Fallback to dynamically generated keypair for local development
  if (!devPrivateKey || !devPublicKey) {
    console.log('Generating dynamic RS256 key pair for dev environment...');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    devPrivateKey = privateKey;
    devPublicKey = publicKey;
  }

  return {
    privateKey: devPrivateKey,
    publicKey: devPublicKey,
  };
}
