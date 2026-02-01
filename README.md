# MediChain - Secure Electronic Health Records

A blockchain-based healthcare data management system with **Zero Knowledge proofs** and **Attribute-Based Access Control (ABAC)**.

This project enables patients to securely upload medical data, manage doctor access, and view historical data. Doctors can manage patient lists, access records, generate consultancy reports, and revoke patient access. Diagnostic centers can create EHR reports with IPFS integration.

## Technologies Used

- **Blockchain:** Ethereum (Solidity 0.8.19)
- **Development Framework:** Foundry (Forge, Anvil, Cast)
- **Local Blockchain:** Anvil (replaces Ganache)
- **Wallet:** MetaMask
- **Decentralized Storage:** IPFS
- **Frontend:** React 18, Tailwind CSS, Web3.js
- **Security:** Zero Knowledge Proofs, ABAC

## Security Features

- **Zero Knowledge Proofs**: Verify attributes without revealing sensitive data
- **ABAC Access Control**: Fine-grained permission management based on user attributes
- **Blockchain Security**: Immutable health records on Ethereum
- **Patient-Controlled**: Patients manage who can access their data



## Screenshots:

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
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts (Node.js)
├── src/
│   ├── components/      # React components
│   ├── context/         # SecurityContext (ZK + ABAC)
│   ├── utils/           # zkProofs.js, abacEngine.js
│   └── config/          # web3Config.js
├── foundry.toml         # Foundry configuration
└── package.json
```

