# MediChain — Secure Electronic Health Records

A blockchain-based healthcare data management system built on Ethereum, using **Zero Knowledge Proofs (ZKP)** and **Attribute-Based Access Control (ABAC)** to give patients complete ownership of their health data.

Patients decide who can access their records, for how long, and can revoke access at any time — all enforced by on-chain smart contracts with an immutable audit trail.

---

## Features

### Patient Portal
- Register with a full health profile (name, DOB, gender, blood group, address)
- Upload past medical records to IPFS
- View all medical records with document retrieval
- Grant and revoke doctor access directly from the Access Control Panel (on-chain)
- Access Control Panel — Permissions tab (grant/revoke), active policies, and audit history
- ZK Verification — view cryptographic proof status for session attributes

### Doctor Portal
- Register with medical credentials (hospital, specialization, department, designation, experience)
- View patients who have granted access
- View individual patient records (ABAC-enforced)
- Write private consultation notes per patient (stored locally)
- Time-limited access that auto-expires

### Diagnostic Center Portal
- Register facility and authenticate
- Create and upload lab reports linked to patient records
- IPFS-backed document storage for all report files

### Security Layer
- **Zero Knowledge Proofs** — age verification, role proof, attribute commitments
- **Attribute-Based Access Control** — role + sensitivity + action-based policy decisions
- **Client-side password hashing** — passwords are hashed with `sha3` before leaving the browser; plaintext is never transmitted
- **Immutable audit trail** — every access attempt logged on-chain
- **Time-bound permissions** — automatic expiration on access grants
- **Emergency access** — 24-hour auto-expiring override (contract-level)

---

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Blockchain** | Ethereum, Solidity 0.8.19 |
| **Dev Framework** | Foundry (Forge, Anvil, Cast) |
| **Local Chain** | Anvil — Chain ID `31337` |
| **Wallet** | MetaMask |
| **Storage** | IPFS via Web3.Storage (local fallback in dev mode) |
| **Frontend** | React 18, React Router v6, Tailwind CSS 3, Web3.js |
| **Security** | Zero Knowledge Proofs, ABAC engine, sha3 password hashing |
| **UI Style** | Glassmorphism dark theme, custom design system |

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `PatientRegistration.sol` | Patient profiles, authentication, permission grants |
| `DoctorRegistration.sol` | Doctor credentials, patient list management, grant/revoke permissions |
| `DiagnosticRegistration.sol` | Diagnostic center registration and authentication |
| `SecureAccessControl.sol` | ZK commitments, ABAC engine, audit logging, emergency access |
| `MedicalRecords.sol` | Record storage, IPFS CID management, lab reports, soft delete |

**Deployed addresses (local Anvil):**

| Contract | Address |
|----------|---------|
| PatientRegistration | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| DoctorRegistration | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| DiagnosticRegistration | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| SecureAccessControl | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| MedicalRecords | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |

---

## Requirements

1. **Node.js** v16 or later — [Download](https://nodejs.org/en/download/)
2. **Foundry** — install via terminal:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```
3. **MetaMask** browser extension — [Chrome Web Store](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the local blockchain (Terminal 1)

```bash
npm run anvil
```

Starts Anvil at `http://127.0.0.1:8545`, Chain ID `31337`. Prints 10 test accounts with private keys.

### 3. Deploy smart contracts (Terminal 2)

```bash
npm run deploy
```

Compiles contracts with Forge, deploys via Web3.js, and saves addresses to `deployment.json`.

### 4. Start the frontend (Terminal 3)

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

### 5. Configure MetaMask

Add a custom network with these settings:

| Field | Value |
|-------|-------|
| Network Name | Anvil Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | ETH |

Import a test account using one of the private keys printed by Anvil on startup.

### 6. IPFS (optional)

Without a token, the app runs in **IPFS dev mode** — files are encoded as base64 and stored in browser localStorage alongside a generated fake CID. The CID is recorded on-chain exactly as it would be in production. This is sufficient for local testing and demos.

To enable real IPFS uploads, create a `.env` file in the project root:

```
REACT_APP_WEB3_STORAGE_TOKEN=your_web3_storage_token_here
```

The upload page shows a yellow "Dev Mode" badge when no token is configured.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run anvil` | Start Anvil local blockchain |
| `npm run deploy` | Build and deploy all contracts |
| `npm run forge:build` | Compile contracts only |
| `npm start` | Start the React dev server |

Or via Make:

```bash
make help       # List all commands
make anvil      # Start blockchain
make deploy     # Deploy contracts
make frontend   # Start React app
```

---

## Project Structure

```
ehr/
├── contracts/                  # Solidity smart contracts (5)
│   ├── PatientRegistration.sol
│   ├── DoctorRegistration.sol
│   ├── DiagnosticRegistration.sol
│   ├── SecureAccessControl.sol
│   └── MedicalRecords.sol
├── scripts/                    # Deployment scripts
│   ├── deploy-contracts.js
│   └── generate-abis.js
├── src/
│   ├── components/             # React components (29)
│   │   ├── LandingPage_1.js    # Public landing page
│   │   ├── AboutPage.js        # About page
│   │   ├── LoginPage.js        # Role selection for login
│   │   ├── RegisterPage.js     # Role selection for registration
│   │   ├── NavBar.js           # Public navigation
│   │   ├── NavBar_Logout.js    # Authenticated navigation
│   │   ├── Footer.js           # Site footer
│   │   ├── Logo.js             # SVG logo component
│   │   ├── ConnectWallet.js    # MetaMask wallet connection
│   │   ├── PatientLogin.js     # Patient sign-in
│   │   ├── DoctorLogin.js      # Doctor sign-in
│   │   ├── DiagnosticLogin.js  # Diagnostic center sign-in
│   │   ├── PatientRegistration.js
│   │   ├── DoctorRegistration.js
│   │   ├── DiagnosticsRegistration.js
│   │   ├── PatientDashBoard.js
│   │   ├── DoctorDashBoard.js
│   │   ├── DiagnosticDashBoard.js
│   │   ├── ViewProfile.js
│   │   ├── ViewDoctorProfile.js
│   │   ├── ViewDiagnosticProfile.js
│   │   ├── ViewPatientRecords.js
│   │   ├── ViewPatientList.js
│   │   ├── DoctorViewPatientRecords.js
│   │   ├── UploadPastRecords.js
│   │   ├── DiagnosticForm.js
│   │   ├── AccessControlPanel.js   # Grant/revoke permissions + ABAC policies + audit log
│   │   ├── ZKVerificationModal.js
│   │   └── RegistrationForm.js
│   ├── context/
│   │   └── SecurityContext.js  # Auth state, ZK proofs, ABAC context
│   ├── utils/
│   │   ├── hashPassword.js     # Client-side sha3 password hashing
│   │   ├── zkProofs.js         # Zero Knowledge Proof implementations
│   │   ├── abacEngine.js       # ABAC policy engine with audit logging
│   │   └── ipfsClient.js       # IPFS / Web3.Storage integration with dev-mode fallback
│   ├── images/                 # Static image assets
│   │   ├── hospital.png
│   │   ├── logo.svg
│   │   ├── logo_new.jpg
│   │   ├── image.png
│   │   └── image-1.png ... image-11.png
│   ├── config/
│   │   └── web3Config.js       # Web3 and Anvil network configuration
│   └── build/contracts/        # Compiled contract ABIs (auto-generated)
├── out/                        # Foundry build artifacts
├── foundry.toml                # Foundry configuration
├── deployment.json             # Deployed contract addresses
├── Makefile                    # Development shortcuts
└── package.json
```

---

## Data Storage

| Layer | What is stored |
|-------|---------------|
| **On-chain (Ethereum)** | User registrations, permission grants, ZK commitments, IPFS CIDs, audit log entries, ABAC attributes |
| **Off-chain (IPFS)** | Medical documents, lab reports, imaging files, prescriptions |
| **Client (localStorage)** | Active session, ZK proof cache, access log (last 100 entries), doctor consultation notes, IPFS dev-mode file data (base64) |

---

## ABAC Role Hierarchy

| Role | Default Clearance | Access |
|------|------------------|--------|
| Patient | Own records only | Read/write own data, grant/revoke permissions |
| Doctor | Level 2 (with patient permission) | Read patient records, write consultation notes |
| Diagnostic | Level 2 | Upload lab reports |
| Admin | Level 4 | Manage users and clearance levels |
| Emergency | Level 3 (24-hour limit) | Override access for critical situations |

---

## Security Notes

- **Passwords** are hashed with `Web3.utils.sha3()` client-side before any contract call. The plaintext password never leaves the browser. The contract stores and compares only the hash.
- **IPFS CIDs** are stored on-chain; the actual files live on IPFS. If a file is tampered with, the hash won't match the stored CID.
- **Permissions** are stored and enforced entirely on-chain — no backend can override them.
- **Audit logs** are immutable once written to the chain.

---

## Known Gaps (Work in Progress)

- **Real ZK cryptography** — current proofs use hash-based commitments, not full elliptic-curve ZK circuits
- **Emergency access UI** — contract function exists; frontend page not yet built
- **Audit log on-chain viewer** — on-chain logs are stored; a dedicated read UI is planned
- **Test coverage** — only one test file currently exists; full test suite is planned
