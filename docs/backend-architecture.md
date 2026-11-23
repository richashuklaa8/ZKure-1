# ArogyaZK backend architecture

## Current architecture

The browser UI is React and TypeScript. It calls an Express API (`server/index.ts`), which authenticates requests and performs business checks before accessing SQLite (`server/db.ts`). The database stores accounts, sessions, patient and hospital profiles, encrypted record metadata, consent permissions, and audit entries. Demo dataset rows live in separate `prototype_*` tables.

```text
React UI
   │ HTTPS / JSON + HttpOnly session cookie
   ▼
Express API
   ├── Session authentication, role checks, request limits, origin checks
   ├── Patient records and consent permissions
   ├── Fail-closed claim, settlement, and break-glass routes
   └── AES-GCM record encryption / optional Kubo IPFS adapter
        │                         │
        ▼                         ▼
     SQLite                 Kubo-compatible IPFS
```

The API binds to `127.0.0.1` by default. Deployment must terminate HTTPS, configure `CORS_ORIGINS`, and keep encryption keys outside the repository. SQLite and the keyring must be backed up separately and restored together.

## Authentication and authorization

Passwords are stored as `scrypt` hashes with random salts. On login, the server checks the hash and creates a random session token. Only its SHA-256 digest is persisted; the raw token is returned in a `Secure` (in production), `HttpOnly`, `SameSite=Strict` cookie. Sessions expire after eight hours.

Routes use role checks for Patient, Hospital, Insurer, or Admin. A patient is linked to one patient ID; patient record access is scoped to that ID. A hospital can decrypt a record only when an active, unexpired consent row identifies that hospital and includes the record ID. Revocation updates permission and cached sharing metadata in a SQLite transaction. The permission row is authoritative for access.

State-changing requests with an `Origin` header must match the configured allowlist. Login attempts and general API requests have process-local throttles; these are useful for a local prototype but are not distributed deployment controls.

## Encrypted medical records

For new records, the API generates a fresh 256-bit data encryption key (DEK) and a fresh 96-bit IV. AES-256-GCM encrypts the record payload and produces an authentication tag. A separate key encryption key (KEK), selected by version from `RECORD_KEYRING_JSON`, wraps the DEK with another AES-256-GCM operation and its own random IV and tag.

SQLite stores ciphertext and metadata needed for decryption: payload IV/tag, wrapped DEK, wrapping IV/tag, key version, content hash, and optional IPFS CID. IPFS receives ciphertext only. At read time, the service checks consent/ownership, downloads ciphertext if a CID exists, unwraps the DEK, verifies the GCM tag, then compares the plaintext SHA-256 hash before returning notes.

The rotation endpoint rewraps each DEK under the configured active KEK version in one database transaction. Keep every previous KEK in the keyring until every record has rotated and backups are verified. Legacy records without a wrapped DEK still need the original `RECORD_ENCRYPTION_KEY` to decrypt or rotate.

### Cryptographic notation

For plaintext `P`, payload key `K`, IV `N`, ciphertext `C`, and GCM tag `T`:

```text
(C, T) = AES-256-GCM-Encrypt(K, N, P)
H     = SHA-256(P)
W, Tw = AES-256-GCM-Encrypt(KEK_version, wrap_IV, K)
```

On retrieval, authenticated GCM decryption must succeed and `SHA-256(P)` must equal stored `H`. GCM provides confidentiality and integrity for the encrypted payload; the hash is an additional consistency check, not a proof of authorship or blockchain anchoring.

## Consent and transactions

Grant validation checks that the linked patient owns every requested record, that the hospital is locally verified, and that the requested duration is within one to 24 hours. In a single SQLite transaction, the API inserts the permission and updates record sharing fields used as a UI cache. Decryption ignores that cache and checks the permission table directly.

Revocation changes permission status and recalculates cached sharing fields from all remaining active permissions. This avoids clearing another hospital's valid consent. Expired permissions are excluded from access checks even if their stored status has not yet been rewritten to `Expired`.

## Claims, ZK proofs, blockchain, and emergency access

Claim submission, insurer settlement, and break-glass operations are disabled or fail closed until real integrations exist. The repository does not contain a configured Circom circuit, witness/proving-key pipeline, deployed verifier, signing service, Sepolia transaction client, or Shamir reconstruction workflow. The UI's demo claims and statuses must not be interpreted as cryptographic or financial evidence.

No Groth16 proof verification mathematics is currently executed by the backend. If implemented, a Groth16 verifier would check a pairing equation over elliptic-curve points and public signals against a trusted verification key; merely storing booleans or a proof-shaped JSON object is not equivalent.

## FHIR status

Record creation still accepts title and free-text notes. It does not create or validate ABDM-compatible FHIR R4 resources. A production MVP should choose concrete resource profiles (for example DiagnosticReport, Observation, and MedicationRequest), validate against the appropriate published FHIR release and ABDM implementation guide, and version those profiles.

## Prototype boundaries

- Prototype people, insurers, hospitals, policies, and cases are synthetic and isolated in `prototype_*` tables.
- New account data in the local SQLite database is intentionally ignored by Git.
- Current request throttles are in-memory and reset when the process restarts.
- Audit logs use SQLite and are not append-only or tamper-evident.
- Authenticated non-browser clients without an `Origin` header are accepted; deploy behind HTTPS and apply appropriate API gateway controls.
