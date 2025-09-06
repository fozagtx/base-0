# Base0 - Filecoin FVM CID Storage

Payment-gated CID storage system built on **Filecoin FVM (Filecoin Virtual Machine)** with MetaMask integration. Users can store content CIDs behind smart contracts and monetize access to their data stored on the Filecoin network.

## 🚀 Features

- **Filecoin FVM Integration**: Deploy on Filecoin network using FVM
- **Payment-Gated Access**: Store CIDs with custom pricing in FIL
- **MetaMask Compatible**: Seamless Web3 wallet integration
- **Decentralized Storage**: Content stored on Filecoin network
- **Deal Verification**: Integration with Filecoin storage deals
- **Revenue Sharing**: Built-in platform fee system (5%)

## 🛠 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) or Node.js
- MetaMask or compatible Web3 wallet
- FIL tokens for Filecoin Calibration testnet

### Installation

```bash
# Install dependencies
bun install

# Compile contracts
bun run compile
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your private key
```

Required environment variables:
```bash
DEPLOYER_PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_key (optional)
```

### Deploy to Filecoin

Deploy to **Filecoin Calibration Testnet**:
```bash
bun run deploy --network calibration
```

Deploy to **Filecoin Mainnet**:
```bash
bun run deploy --network filecoin
```

## 📖 Usage Guide

### 1. Store Content on Filecoin

Store your content with both piece CID (Filecoin) and data CID:

```bash
bun hardhat store-cid \
  --contract <CONTRACT_ADDRESS> \
  --piece-cid <FILECOIN_PIECE_CID> \
  --data-cid <ORIGINAL_DATA_CID> \
  --price 0.01 \
  --title "My Premium Content" \
  --description "Exclusive content stored on Filecoin" \
  --piece-size 1048576 \
  --network calibration
```

### 2. Purchase Access with MetaMask

Users can purchase access using any Web3 wallet:

```bash
bun hardhat purchase-access \
  --contract <CONTRACT_ADDRESS> \
  --content-id 1 \
  --network calibration
```

### 3. Retrieve CID After Payment

Access the data CID after successful payment:

```bash
bun hardhat get-cid \
  --contract <CONTRACT_ADDRESS> \
  --content-id 1 \
  --network calibration
```

## 🏗 Architecture

### FilecoinCIDStore Contract

The main contract provides:

- **Content Storage**: Store piece CID + data CID with pricing
- **Access Control**: Payment-gated CID retrieval
- **Deal Integration**: Track Filecoin storage deals
- **Revenue System**: Automated payment distribution

### Key Functions

```solidity
// Store content on Filecoin
function storeContent(
    bytes memory _piece_cid,
    string memory _data_cid,
    uint256 _price,
    string memory _title,
    string memory _description,
    uint256 _piece_size
) external returns (uint256)

// Purchase access with FIL
function purchaseAccess(uint256 _content_id) external payable

// Retrieve data CID after payment
function getCID(uint256 _content_id) external returns (string memory)

// Check Filecoin deal status
function checkDealActivation(uint256 _content_id) external view returns (bool)
```

## 🌐 Filecoin Networks

### Calibration Testnet
- **Network**: `calibration`
- **RPC**: `https://rpc.ankr.com/filecoin_testnet`
- **Explorer**: https://calibration.filfox.info/
- **Faucet**: https://faucet.calibration.fildev.network/

### Filecoin Mainnet
- **Network**: `filecoin`
- **RPC**: `https://rpc.ankr.com/filecoin`
- **Explorer**: https://filfox.info/

## 💡 How It Works

1. **Content Owner**:
   - Stores file on Filecoin network
   - Gets piece CID (commP) from storage deal
   - Stores piece CID + data CID in contract with price
   - Receives payments when users purchase access

2. **Content Consumer**:
   - Browses available content
   - Pays with FIL using MetaMask
   - Gets access to data CID for 365 days
   - Can retrieve content from Filecoin network

3. **Filecoin Integration**:
   - Contract tracks Filecoin deal status
   - Verifies storage deal activation
   - Provides deal information to users

## 🔧 Development Commands

```bash
# Compile contracts
bun run compile

# Run local Filecoin node (for testing)
bun run chain

# Deploy to local network
bun run deploy --network hardhat

# Run tests
bun run test

# Check account balance
bun run account --network calibration
```

## 📊 Revenue Model

- **Content Creator**: Receives 95% of payment
- **Platform**: Takes 5% platform fee
- **Access Duration**: 365 days per purchase
- **Payment Token**: FIL (Filecoin native token)

## 🔐 Security Features

- **Access Control**: Only paid users can retrieve CIDs
- **Time-based Access**: Access expires after 1 year
- **Owner Privileges**: Content owners always have access
- **Deal Verification**: Integration with Filecoin deal status

## 🚀 Integration with Base0 App

This contract system powers decentralized content monetization:

1. **Upload Flow**: Users upload to Filecoin → Get piece CID → Store in contract
2. **Discovery**: Browse content marketplace
3. **Payment**: MetaMask integration for FIL payments  
4. **Access**: Retrieve CIDs and download from Filecoin
5. **Revenue**: Creators earn FIL from their content

## 📝 Example Workflow

```javascript
// 1. Deploy contract
const contract = await deploy("FilecoinCIDStore");

// 2. Store content
const contentId = await contract.storeContent(
  pieceCID,     // Filecoin piece CID
  dataCID,      // Original data CID  
  priceInFIL,   // Price in attoFIL
  title,        // Content title
  description,  // Content description
  pieceSize     // Size in bytes
);

// 3. User purchases access
await contract.purchaseAccess(contentId, { value: price });

// 4. User retrieves CID
const dataCID = await contract.getCID(contentId);

// 5. User downloads from Filecoin network using CID
```

## 🌟 Benefits

- **True Decentralization**: No central servers, runs on Filecoin FVM
- **Censorship Resistant**: Content stored on distributed Filecoin network  
- **Creator Economy**: Direct monetization without intermediaries
- **Web3 Native**: Full MetaMask and wallet integration
- **Transparent**: All transactions on-chain and verifiable

## 📞 Support

For questions about Filecoin FVM integration:
- [Filecoin Documentation](https://docs.filecoin.io/)
- [FVM Documentation](https://docs.filecoin.io/smart-contracts/fundamentals/the-fvm)
- [Filecoin Slack](https://filecoin.io/slack)

## 📄 License

MIT License