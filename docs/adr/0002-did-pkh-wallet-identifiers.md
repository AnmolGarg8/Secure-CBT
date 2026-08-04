# ADR 0002: Choosing did:pkh for Web3 Wallet Identifiers

## Context and Problem Statement
SecureCBT needs to assign decentralized identifiers (DIDs) to users' provisioned wallets. These DIDs are stored in the database and utilized to anchor exam compliance certifications. We need a standardized DID format that natively represents public-key-hash-based Ethereum/EVM addresses on the Polygon network.

## Decision Drivers
- Standardization across standard decentralised storage schemas.
- Natively represents raw blockchain wallet addresses without introducing custom resolver services.
- Compatibility with EVM chains (e.g. Polygon Amoy chain `80002`).

## Considered Options
1. **`did:key`**: Represents raw public keys. However, it requires mapping public keys instead of EVM-compatible checksummed addresses.
2. **Custom Method (`did:securecbt`)**: Requires writing and maintaining a custom DID resolver, adding unnecessary complexity.
3. **`did:pkh` (Public Key Hash)**: A W3C compliant standard representation for public-key-hash-based account identifiers (`did:pkh:eip155:<chain-id>:<checksummed-address>`).

## Decision Outcome
We chose **`did:pkh`** because:
- It maps 1:1 with EVM address representations natively.
- It identifies both the chain namespace (`eip155:80002` for Polygon Amoy) and the account, removing ambiguity.
- Requires no custom registry or external resolvers.
