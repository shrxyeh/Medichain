#!/usr/bin/env node

/**
 * Generate ABI files for frontend from Foundry output
 * This creates Truffle-compatible JSON files that the React app expects
 */

const fs = require('fs');
const path = require('path');

// Paths
const FOUNDRY_OUT = path.join(__dirname, '..', 'out');
const BUILD_DIR = path.join(__dirname, '..', 'src', 'build', 'contracts');
const DEPLOYMENT_FILE = path.join(__dirname, '..', 'deployment.json');

// Contracts to process
const CONTRACTS = [
  'PatientRegistration',
  'DoctorRegistration',
  'DiagnosticRegistration',
  'SecureAccessControl',
  'MedicalRecords',
];

// Default network ID for Anvil
const ANVIL_NETWORK_ID = '31337';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadDeploymentAddresses() {
  try {
    if (fs.existsSync(DEPLOYMENT_FILE)) {
      return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf8'));
    }
  } catch (error) {
    console.warn('Warning: Could not load deployment.json:', error.message);
  }
  return {};
}

function generateAbiFiles() {
  ensureDir(BUILD_DIR);

  const deployedAddresses = loadDeploymentAddresses();

  console.log('Generating ABI files for frontend...\n');

  for (const contractName of CONTRACTS) {
    const foundryArtifactPath = path.join(
      FOUNDRY_OUT,
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(foundryArtifactPath)) {
      console.warn(`Warning: Foundry artifact not found for ${contractName}`);
      console.warn(`Expected at: ${foundryArtifactPath}`);
      console.warn('Run "forge build" first.\n');
      continue;
    }

    // Read Foundry artifact
    const foundryArtifact = JSON.parse(fs.readFileSync(foundryArtifactPath, 'utf8'));

    // Get deployed address if available
    const deployedAddress = deployedAddresses[contractName] || '';

    // Create Truffle-compatible format
    const truffleFormat = {
      contractName: contractName,
      abi: foundryArtifact.abi,
      bytecode: foundryArtifact.bytecode.object,
      deployedBytecode: foundryArtifact.deployedBytecode.object,
      networks: {
        [ANVIL_NETWORK_ID]: {
          address: deployedAddress,
          transactionHash: '',
        },
      },
      // Metadata for compatibility
      compiler: {
        name: 'solc',
        version: '0.8.19',
      },
      updatedAt: new Date().toISOString(),
    };

    // Write to build directory
    const outputPath = path.join(BUILD_DIR, `${contractName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(truffleFormat, null, 2));

    console.log(`✓ Generated: ${contractName}.json`);
    if (deployedAddress) {
      console.log(`  Address: ${deployedAddress}`);
    }
  }

  console.log('\nABI generation complete!');
  console.log(`Files written to: ${BUILD_DIR}`);
}

// Run
generateAbiFiles();
