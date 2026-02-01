# MediChain - Secure Electronic Health Records

A blockchain-based healthcare data management system with **Zero Knowledge Proofs (ZKP)** and **Attribute-Based Access Control (ABAC)**.

Patients have complete control over their medical data - deciding who can access it, revoking access at any time, and maintaining an immutable audit trail of all access attempts.

## Features

### Patient Portal
- Register and manage personal health profile
- Upload and view medical records
- Grant/revoke access to doctors with fine-grained permissions
- View complete medical history with audit trail
- Access control panel for managing permissions

### Doctor Portal
- Register with credentials and specialization
- View patient list (patients who granted access)
- Access patient records with permission verification
- Generate consultation reports and prescriptions
- Time-limited access with automatic expiration

### Diagnostic Center Portal
- Register diagnostic facilities
- Create and upload laboratory reports
- IPFS-based file storage for medical documents
- Associate reports with patient records

### Emergency Access
- Time-limited (24-hour) emergency access for critical situations
- Comprehensive audit logging of emergency access

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Blockchain** | Ethereum (Solidity 0.8.19) |
| **Framework** | Foundry (Forge, Anvil, Cast) |
| **Local Blockchain** | Anvil (Chain ID: 31337) |
| **Wallet** | MetaMask |
| **Storage** | IPFS via Web3.Storage |
| **Frontend** | React 18, Tailwind CSS, Web3.js |
| **Security** | Zero Knowledge Proofs, ABAC |

## Smart Contracts

| Contract | Description |
|----------|-------------|
| `PatientRegistration.sol` | Patient registration, profile management, permission grants |
| `DoctorRegistration.sol` | Doctor registration, credentials, patient list management |
| `DiagnosticRegistration.sol` | Diagnostic center registration and authentication |
| `SecureAccessControl.sol` | ZK proofs + ABAC engine, permission expiration, audit logging |
| `MedicalRecords.sol` | Medical record storage, IPFS CID management, record types |

## Security Features

- **Zero Knowledge Proofs**: Verify age, credentials, and medical clearance without revealing actual data
- **Attribute-Based Access Control**: Fine-grained permissions based on roles, attributes, and sensitivity levels
- **Blockchain Immutability**: Tamper-proof health records on Ethereum
- **Patient-Controlled Access**: Complete control over who can view records
- **Time-Bound Permissions**: Automatic expiration of access grants
- **Audit Trail**: Every access attempt is logged for transparency

## Screenshots

### HomePage:

![alt text](image-4.png)

![alt text](image-2.png)

![alt text](image-3.png)

![alt text](image-5.png)

---

### Login:

![alt text](image-6.png)

---

### Patient Side:

![alt text](image-7.png)

![alt text](image.png)

![alt text](image-1.png)

![Patient Side 4](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/2e17c358-89b6-4c74-afec-6f07db6515d4)

![Patient Side 5](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/98283e49-c4cc-41ba-95b0-1a2e1afbff77)

---

### Doctor Side:

![alt text](image-8.png)

![alt text](image-9.png)

![alt text](image-10.png)
![Doctor Side 4](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/1572acf6-fd11-4044-9075-f8604de5657a)

---

### Diagnostic Side:

![Diagnostic Side 1](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/f66e9981-6b98-483c-bf25-560bc13f5fc0)

![alt text](image-11.png)
---

### Report View for Patient and Doctor:

![Report View 1](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/b5549f81-7dd3-4e2c-8514-b44ed045fec2)

![Report View 2](https://github.com/Sonu208/Secure-Electronic-Health-Records/assets/99793746/c3b6c074-1fc2-4f92-a2ec-f4a3b6b0d4b2)

---

## Requirements

1. **Node.js** (v16 or later): [Download](https://nodejs.org/en/download/)

2. **Foundry** - Install from terminal:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

3. **MetaMask Extension**: [Chrome Web Store](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)

4. **IPFS (Optional)**: [Download Kubo](https://dist.ipfs.tech/#go-ipfs)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Anvil (Terminal 1)

```bash
npm run anvil
```

This starts a local blockchain at `http://127.0.0.1:8545` with Chain ID `31337`.

### 3. Deploy Contracts (Terminal 2)

```bash
npm run deploy
```

### 4. Start Frontend (Terminal 3)

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Configure MetaMask

Add Anvil network:
- **Network Name:** Anvil Local
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 31337
- **Currency:** ETH

Import a test account using Anvil's private key (shown when Anvil starts).

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run anvil` | Start Anvil local blockchain |
| `npm run deploy` | Build and deploy contracts to Anvil |
| `npm run forge:build` | Build contracts only |
| `npm start` | Start React dev server |

Or use Make:
```bash
make help      # Show all commands
make anvil     # Start blockchain
make deploy    # Deploy contracts
make frontend  # Start React app
```

---

## Project Structure

```
ehr/
├── contracts/                  # Solidity smart contracts
│   ├── PatientRegistration.sol
│   ├── DoctorRegistration.sol
│   ├── DiagnosticRegistration.sol
│   ├── SecureAccessControl.sol
│   └── MedicalRecords.sol
├── scripts/                    # Deployment scripts
│   ├── deploy-contracts.js
│   └── generate-abis.js
├── src/
│   ├── components/             # React components (24 components)
│   ├── context/
│   │   └── SecurityContext.js  # ZK + ABAC React context
│   ├── utils/
│   │   ├── zkProofs.js         # Zero Knowledge Proof implementations
│   │   ├── abacEngine.js       # ABAC policy engine
│   │   └── ipfsClient.js       # IPFS/Web3.Storage integration
│   ├── config/
│   │   └── web3Config.js       # Web3 & Anvil configuration
│   └── build/contracts/        # Compiled contract ABIs
├── out/                        # Foundry build artifacts
├── foundry.toml                # Foundry configuration
├── deployment.json             # Deployed contract addresses
├── Makefile                    # Development commands
└── package.json
```

## Data Storage

| Location | Data |
|----------|------|
| **On-Chain** | User registrations, permissions, ZK commitments, IPFS CIDs, audit logs |
| **IPFS** | Medical documents, lab reports, diagnostic images |
| **Browser** | User session, proofs cache, access logs |
