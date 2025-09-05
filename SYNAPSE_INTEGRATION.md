# Synapse SDK Integration for Filecoin Storage

This document explains how the Synapse SDK has been integrated into Base0 to store generated AI avatar images on the Filecoin network.

## Overview

The integration allows generated images to be automatically stored on Filecoin using the Synapse SDK, providing decentralized storage for user creations.

## Setup Requirements

### 1. Dependencies

The following packages were added:
```bash
bun add @filoz/synapse-sdk ethers
```

### 2. Environment Variables

Add to your `.env` file:
```env
# Synapse SDK Configuration for Filecoin Storage
# Private key for server-side Synapse operations (optional, can use browser wallet)
SYNAPSE_PRIVATE_KEY=your_private_key_here
# Network: calibration (testnet) or mainnet
SYNAPSE_NETWORK=calibration
```

**Note**: The `SYNAPSE_PRIVATE_KEY` is optional. If not provided, the system will use the user's connected MetaMask wallet for storage operations.

## Architecture

### Core Components

1. **SynapseImageStorage** (`src/lib/synapse.ts`)
   - Main class handling Filecoin storage operations
   - Supports both server-side (private key) and client-side (MetaMask) initialization
   - Handles image data conversion and upload

2. **useSynapseStorage** (`src/hooks/useSynapseStorage.ts`)
   - React hook for client-side Synapse operations
   - Integrates with user's connected wallet
   - Provides loading states and error handling

3. **API Integration** (`src/app/api/generate-image/route.ts`)
   - Server-side image generation with automatic Filecoin storage
   - Falls back gracefully if storage fails
   - Returns storage metadata to client

## How It Works

### Image Generation Flow

1. **User generates image** in playground
2. **Server generates image** using Gemini AI
3. **Server stores image** on Filecoin (if configured)
4. **Client receives** both image URL and Filecoin storage info
5. **UI displays** storage status and CID information

### Storage Process

```typescript
// Initialize Synapse
const synapse = new SynapseImageStorage();
await synapse.initialize(); // Uses MetaMask or private key

// Store image
const storedImage = await synapse.storeImage(imageData, {
  prompt: "user prompt",
  walletAddress: "0x...",
});

// Result includes:
// - pieceCid: Filecoin piece CID
// - url: Explorer URL
// - timestamp: Storage timestamp
```

## UI Features

### Storage Indicators

Generated images show Filecoin storage status:
- **Green dot + "Stored"** - Successfully stored on Filecoin
- **CID display** - Short version of piece CID
- **Explorer link** - Direct link to Filecoin explorer

### Preview Nodes

The PreviewImageNode and PreviewAnyNode components display:
- Storage status indicators
- Piece CID information  
- Links to Filecoin explorers
- Storage timestamps

## Configuration Options

### Network Selection

Currently configured for Calibration testnet:
```typescript
rpcURL: RPC_URLS.calibration.websocket
```

For production, change to:
```typescript
rpcURL: RPC_URLS.mainnet.websocket
```

### Storage Metadata

Images are stored with metadata:
```typescript
{
  prompt: string;        // User's generation prompt
  nodeId: string;        // Playground node ID
  walletAddress: string; // User's wallet address
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Initialization failures** - Falls back to local storage only
2. **Storage failures** - Continues without failing image generation
3. **Network issues** - Graceful degradation
4. **Missing wallet** - Clear user feedback

## Testing

### Development Testing

1. **Set up testnet wallet** with Calibration network
2. **Add test funds** for storage payments
3. **Generate images** in playground
4. **Verify storage** via explorer links

### Production Checklist

- [ ] Switch to mainnet RPC URLs
- [ ] Configure production private key (optional)
- [ ] Test with real wallet funds
- [ ] Monitor storage costs
- [ ] Set up error monitoring

## Troubleshooting

### Common Issues

1. **"Synapse SDK not initialized"**
   - Check wallet connection
   - Verify network configuration
   - Ensure proper MetaMask setup

2. **Storage failures**
   - Check wallet balance
   - Verify network connectivity
   - Review Filecoin network status

3. **TypeScript errors**
   - Ensure proper type definitions
   - Check Synapse SDK version compatibility

### Debug Mode

Enable debug logging:
```typescript
console.log('Synapse storage:', synapseStorage.isInitialized());
```

## Security Considerations

1. **Private Key** - Store securely, use environment variables
2. **Wallet Permissions** - Users control their own storage operations
3. **Data Privacy** - Images stored publicly on Filecoin
4. **Cost Management** - Monitor storage costs and limits

## Future Enhancements

Potential improvements:
- [ ] Batch storage operations
- [ ] Storage cost estimation
- [ ] Image retrieval interface
- [ ] Storage analytics dashboard
- [ ] IPFS gateway integration

## Support

For issues with Synapse SDK:
- [Synapse SDK GitHub](https://github.com/FilOzone/synapse-sdk)
- [Filecoin Documentation](https://docs.filecoin.io)

For Base0-specific integration issues:
- Check application logs
- Review wallet connection status
- Verify environment configuration