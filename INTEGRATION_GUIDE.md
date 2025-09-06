# Base0 Filecoin FVM Integration Guide

Complete guide for integrating your payment-gated CID storage system with the Filecoin FVM network and MetaMask.

## 🏗 Architecture Overview

Your Base0 app now includes:

```
base0/
├── contracts/
│   └── FilecoinCIDStore.sol          # Main smart contract
├── frontend/src/
│   ├── contracts/
│   │   └── config.ts                 # Network configuration
│   ├── hooks/
│   │   └── useFilecoinCIDStore.ts    # React hook
│   ├── utils/
│   │   └── filecoin.ts               # Utilities
│   └── components/
│       └── FilecoinWallet.tsx        # Wallet component
├── tasks/                            # CLI interaction tools
├── deploy/                           # Deployment scripts
└── typechain-types/                  # Generated TypeScript types
```

## 🚀 Deployment

### 1. Deploy to Filecoin Calibration Testnet

```bash
# Deploy the smart contract
bun run deploy --network calibration
```

This will:
- Deploy `FilecoinCIDStore` contract to Calibration testnet
- Generate TypeScript types for frontend integration
- Save contract addresses to frontend config files
- Update `.env.example` with contract addresses

### 2. Deploy to Filecoin Mainnet

```bash
# Deploy to mainnet (use real FIL)
bun run deploy --network filecoin
```

## 💻 Frontend Integration

### 1. Install Dependencies

Your frontend will need these packages:

```bash
# React/Next.js project
npm install ethers@^6.0.0

# Or if using bun
bun add ethers@^6.0.0
```

### 2. Environment Configuration

Copy the deployed contract address to your `.env.local`:

```env
# After deployment, copy the address from console output
NEXT_PUBLIC_CALIBRATION_CID_STORE_ADDRESS=0x...
NEXT_PUBLIC_FILECOIN_CID_STORE_ADDRESS=0x...
```

### 3. Basic React Integration

```tsx
import React, { useState } from 'react';
import { useFilecoinCIDStore } from './hooks/useFilecoinCIDStore';
import { FilecoinWallet } from './components/FilecoinWallet';

export function Base0App() {
  const [network] = useState<'calibration' | 'filecoin'>('calibration');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const {
    storeContent,
    purchaseAccess,
    getCID,
    getAllActiveContent,
    isLoading,
    error
  } = useFilecoinCIDStore(network);

  const handleStoreContent = async (fileData: {
    pieceCid: string;
    dataCid: string;
    title: string;
    description: string;
    price: string;
    pieceSize: number;
  }) => {
    try {
      const contentId = await storeContent(fileData);
      console.log('Content stored with ID:', contentId);
    } catch (err) {
      console.error('Failed to store content:', err);
    }
  };

  const handlePurchaseAccess = async (contentId: number) => {
    try {
      await purchaseAccess(contentId);
      console.log('Access purchased successfully');
    } catch (err) {
      console.error('Failed to purchase access:', err);
    }
  };

  const handleGetCID = async (contentId: number) => {
    try {
      const dataCid = await getCID(contentId);
      console.log('Retrieved CID:', dataCid);
      // Now you can use this CID to access content from IPFS/Filecoin
    } catch (err) {
      console.error('Failed to get CID:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Base0 - Filecoin FVM Storage</h1>
      
      {/* Wallet Connection */}
      <FilecoinWallet 
        network={network} 
        onConnect={setIsWalletConnected} 
      />
      
      {/* Your app content here */}
      {isWalletConnected && (
        <div className="mt-6">
          <p>Wallet connected! You can now interact with the Filecoin network.</p>
          {/* Add your UI components for storing/purchasing content */}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔧 Contract Interaction

### CLI Commands

```bash
# Store content on Filecoin
bun hardhat store-cid \
  --contract 0x... \
  --piece-cid baga6ea4seaq... \
  --data-cid QmX... \
  --price 0.01 \
  --title "My Premium Content" \
  --description "Exclusive content" \
  --piece-size 1048576 \
  --network calibration

# Purchase access
bun hardhat purchase-access \
  --contract 0x... \
  --content-id 1 \
  --network calibration

# Retrieve CID after purchase
bun hardhat get-cid \
  --contract 0x... \
  --content-id 1 \
  --network calibration
```

### Programmatic Usage

```typescript
// Store content
const contentId = await storeContent({
  pieceCid: "baga6ea4seaq...", // Filecoin piece CID
  dataCid: "QmX...",           // Original IPFS CID
  price: "0.01",               // Price in FIL
  title: "My Content",
  description: "Premium content",
  pieceSize: 1048576
});

// Purchase access
await purchaseAccess(contentId);

// Get CID after purchase
const dataCid = await getCID(contentId);

// Access content via IPFS gateways
const contentUrl = `https://ipfs.io/ipfs/${dataCid}`;
```

## 💰 Payment Flow

1. **Content Creator**:
   - Uploads file to Filecoin network
   - Gets piece CID (commP) from storage deal
   - Calls `storeContent()` with piece CID + data CID + price
   - Receives 95% of payments

2. **Content Consumer**:
   - Browses available content
   - Pays with FIL using MetaMask
   - Gets 365-day access to data CID
   - Can retrieve content from IPFS/Filecoin

3. **Platform**:
   - Receives 5% platform fee
   - Manages contract deployment
   - Provides frontend interface

## 🌐 Network Configuration

### MetaMask Setup

Users need to add Filecoin networks to MetaMask:

**Calibration Testnet**:
- Network Name: `Filecoin Calibration`
- RPC URL: `https://api.calibration.node.glif.io/rpc/v1`
- Chain ID: `314159`
- Currency: `tFIL`
- Explorer: `https://calibration.filfox.info`

**Filecoin Mainnet**:
- Network Name: `Filecoin Mainnet`
- RPC URL: `https://api.node.glif.io/rpc/v1`
- Chain ID: `314`
- Currency: `FIL`
- Explorer: `https://filfox.info`

The `FilecoinWallet` component automatically handles network switching.

## 🔐 Security Features

- **Access Control**: Only paid users can retrieve CIDs
- **Time-based Access**: Access expires after 365 days
- **Owner Privileges**: Content owners always have access
- **Deal Verification**: Integration with Filecoin deal status
- **Reentrancy Protection**: Secure payment handling

## 📊 Contract Features

- **Payment-gated CIDs**: Store CIDs behind paywall
- **Filecoin Integration**: Track storage deal status
- **MetaMask Compatible**: Web3 wallet integration
- **Revenue Sharing**: Automated fee distribution
- **Access Management**: Time-based permissions
- **Deal Monitoring**: Check Filecoin deal activation

## 🛠 Development Workflow

1. **Local Development**:
   ```bash
   bun run chain          # Start local hardhat node
   bun run deploy         # Deploy to local network
   ```

2. **Testing**:
   ```bash
   bun run test           # Run contract tests
   bun run compile        # Compile contracts
   ```

3. **Production Deployment**:
   ```bash
   bun run deploy --network calibration  # Testnet
   bun run deploy --network filecoin     # Mainnet
   ```

## 🎯 Next Steps

1. **Get Test FIL**: Visit [Filecoin Calibration Faucet](https://faucet.calibnet.chainsafe-fil.io)
2. **Deploy Contract**: Run `bun run deploy --network calibration`
3. **Integrate Frontend**: Import the provided React hooks
4. **Test Flow**: Store content → Purchase access → Retrieve CID
5. **Go Live**: Deploy to Filecoin mainnet when ready

Your Base0 app now has a complete **Filecoin FVM payment-gated CID storage system** with MetaMask integration! 🚀