#!/usr/bin/env node

/**
 * Deploy contracts to Anvil using Web3.js
 * This is a simpler alternative to Foundry's forge script
 */

const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Anvil configuration
const RPC_URL = 'http://127.0.0.1:8545';
const CHAIN_ID = 31337;

// Default Anvil private key (account 0)
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Paths
const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const BUILD_DIR = path.join(__dirname, '..', 'src', 'build', 'contracts');
const DEPLOYMENT_FILE = path.join(__dirname, '..', 'deployment.json');

// Contract sources (order matters - dependencies first)
const CONTRACTS = [
  'PatientRegistration',
  'DoctorRegistration',
  'DiagnosticRegistration',
  'SecureAccessControl',
  'MedicalRecords'
];

// Contracts that need constructor arguments
const CONSTRUCTOR_ARGS = {
  // MedicalRecords needs PatientRegistration address
  'MedicalRecords': (deployedAddresses) => [deployedAddresses['PatientRegistration']]
};

async function compileContract(contractName) {
  const sourcePath = path.join(CONTRACTS_DIR, `${contractName}.sol`);
  const source = fs.readFileSync(sourcePath, 'utf8');

  // Use solc via command line
  const solcInput = JSON.stringify({
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: { content: source }
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      }
    }
  });

  try {
    // Try to use forge to compile
    console.log(`Compiling ${contractName}...`);
    execSync('forge build', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });

    // Read from forge output
    const artifactPath = path.join(__dirname, '..', 'out', `${contractName}.sol`, `${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return {
        abi: artifact.abi,
        bytecode: artifact.bytecode.object
      };
    }
  } catch (e) {
    console.log(`Forge compile failed, trying solcjs...`);
  }

  // Fallback: try solcjs if available
  try {
    const solc = require('solc');
    const output = JSON.parse(solc.compile(solcInput));

    if (output.errors) {
      const errors = output.errors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        console.error('Compilation errors:', errors);
        return null;
      }
    }

    const contract = output.contracts[`${contractName}.sol`][contractName];
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (e) {
    console.error(`Failed to compile ${contractName}:`, e.message);
    return null;
  }
}

async function deploy() {
  console.log('========================================');
  console.log('  MediChain Contract Deployment');
  console.log('========================================\n');

  // Check if Anvil is running
  const web3 = new Web3(RPC_URL);
  try {
    await web3.eth.getChainId();
  } catch (e) {
    console.error('Error: Cannot connect to Anvil at', RPC_URL);
    console.error('Make sure Anvil is running: npm run anvil');
    process.exit(1);
  }

  console.log(`Connected to Anvil at ${RPC_URL}`);

  // Get deployer account
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  console.log(`Deployer: ${account.address}\n`);

  const deployedAddresses = {};

  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // First, try to compile with forge
  console.log('Building contracts with Forge...');
  try {
    execSync('forge build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  } catch (e) {
    console.log('Forge build had issues, will try to use existing artifacts...');
  }

  // Deploy each contract
  for (const contractName of CONTRACTS) {
    console.log(`\nDeploying ${contractName}...`);

    // Try to read from forge output
    const artifactPath = path.join(__dirname, '..', 'out', `${contractName}.sol`, `${contractName}.json`);

    let abi, bytecode;

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      abi = artifact.abi;
      bytecode = artifact.bytecode.object;
    } else {
      console.error(`Artifact not found for ${contractName}`);
      console.error('Please run: forge build');
      continue;
    }

    if (!bytecode || bytecode === '0x') {
      console.error(`No bytecode for ${contractName}, skipping...`);
      continue;
    }

    try {
      const contract = new web3.eth.Contract(abi);

      // Get constructor arguments if needed
      let constructorArgs = [];
      if (CONSTRUCTOR_ARGS[contractName]) {
        constructorArgs = CONSTRUCTOR_ARGS[contractName](deployedAddresses);
        console.log(`  Constructor args: ${JSON.stringify(constructorArgs)}`);
      }

      const deployTx = contract.deploy({
        data: '0x' + bytecode.replace(/^0x/, ''),
        arguments: constructorArgs
      });

      const gas = await deployTx.estimateGas({ from: account.address });

      const deployed = await deployTx.send({
        from: account.address,
        gas: Math.floor(gas * 1.2),
        gasPrice: await web3.eth.getGasPrice()
      });

      console.log(`✓ ${contractName} deployed at: ${deployed.options.address}`);
      deployedAddresses[contractName] = deployed.options.address;

      // Save ABI in Truffle-compatible format
      const truffleFormat = {
        contractName,
        abi,
        networks: {
          [CHAIN_ID]: {
            address: deployed.options.address,
            transactionHash: ''
          }
        }
      };

      fs.writeFileSync(
        path.join(BUILD_DIR, `${contractName}.json`),
        JSON.stringify(truffleFormat, null, 2)
      );

    } catch (e) {
      console.error(`Failed to deploy ${contractName}:`, e.message);
    }
  }

  // Save deployment addresses
  const deploymentInfo = {
    ...deployedAddresses,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deploymentInfo, null, 2));

  console.log('\n========================================');
  console.log('  Deployment Complete!');
  console.log('========================================');
  console.log('\nContract Addresses:');
  Object.entries(deployedAddresses).forEach(([name, addr]) => {
    console.log(`  ${name}: ${addr}`);
  });
  console.log(`\nAddresses saved to: deployment.json`);
  console.log(`ABIs saved to: src/build/contracts/`);
}

deploy().catch(console.error);
