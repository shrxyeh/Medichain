# MediChain - Makefile for Foundry/Anvil workflow

.PHONY: all install build deploy anvil clean help frontend

# Default target
all: help

# Install dependencies
install:
	@echo "Installing npm dependencies..."
	npm install

# Build contracts with Foundry
build:
	@echo "Building contracts..."
	forge build

# Start Anvil local blockchain
anvil:
	@echo "Starting Anvil..."
	anvil --host 0.0.0.0 --port 8545 --chain-id 31337 --accounts 10 --balance 10000

# Deploy contracts to Anvil
deploy:
	@echo "Building and deploying contracts..."
	npm run deploy

# Start frontend development server
frontend:
	@echo "Starting React frontend..."
	npm start

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	forge clean
	rm -rf src/build/contracts/*.json
	rm -rf out/
	rm -f deployment.json

# Quick development setup
dev-setup:
	@echo "Development Setup Instructions:"
	@echo "================================"
	@echo ""
	@echo "1. Terminal 1 - Start Anvil:"
	@echo "   make anvil"
	@echo ""
	@echo "2. Terminal 2 - Deploy contracts:"
	@echo "   make deploy"
	@echo ""
	@echo "3. Terminal 3 - Start frontend:"
	@echo "   make frontend"

# Help
help:
	@echo "MediChain - Foundry/Anvil Commands"
	@echo "=============================="
	@echo ""
	@echo "  make install    - Install npm dependencies"
	@echo "  make build      - Build contracts with Forge"
	@echo "  make anvil      - Start Anvil local blockchain"
	@echo "  make deploy     - Build and deploy contracts"
	@echo "  make frontend   - Start React development server"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make dev-setup  - Show development setup instructions"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make anvil     (in terminal 1)"
	@echo "  2. make deploy    (in terminal 2)"
	@echo "  3. make frontend  (in terminal 3)"
