// Filecoin utilities for Base0 app
export const FILECOIN_IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
] as const;

// Format FIL amounts
export const formatFIL = (amount: string | number, decimals: number = 4): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toFixed(decimals)} FIL`;
};

// Format large numbers
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Format timestamps
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Generate IPFS URLs
export const getIPFSUrls = (cid: string): string[] => {
  return FILECOIN_IPFS_GATEWAYS.map(gateway => `${gateway}${cid}`);
};

// Get the best IPFS gateway URL
export const getBestIPFSUrl = (cid: string): string => {
  return `${FILECOIN_IPFS_GATEWAYS[0]}${cid}`;
};

// Validate CID format
export const isValidCID = (cid: string): boolean => {
  try {
    // Basic CID validation - starts with 'Q' (v0) or 'b' (v1) or 'Qm' (typical IPFS)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|[Qm][1-9A-HJ-NP-Za-km-z]{44})$/.test(cid);
  } catch {
    return false;
  }
};

// Convert file to piece CID (placeholder - requires actual Filecoin piece generation)
export const generatePieceCID = async (file: File): Promise<string> => {
  // This is a placeholder. In a real implementation, you would:
  // 1. Use Filecoin piece generation tools
  // 2. Calculate commP (piece CID) from the file
  // 3. Return the actual piece CID

  // For now, return a mock piece CID
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // This is NOT a real piece CID - just for demo
  return `baga6ea4seaq${hashHex.substring(0, 32)}`;
};

// Error handling for Filecoin operations
export const handleFilecoinError = (error: any): string => {
  if (error.message?.includes('execution reverted')) {
    if (error.message.includes('Purchase required')) {
      return 'You need to purchase access to view this content.';
    }
    if (error.message.includes('Access expired')) {
      return 'Your access to this content has expired.';
    }
    if (error.message.includes('Already has access')) {
      return 'You already have access to this content.';
    }
    if (error.message.includes('Owner cannot purchase')) {
      return 'You cannot purchase access to your own content.';
    }
    if (error.message.includes('Insufficient payment')) {
      return 'Insufficient payment amount.';
    }
    if (error.message.includes('Content not active')) {
      return 'This content is no longer active.';
    }
  }

  if (error.message?.includes('user rejected')) {
    return 'Transaction was rejected by user.';
  }

  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient FIL balance to complete transaction.';
  }

  return error.message || 'An unknown error occurred.';
};

// MetaMask detection
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.ethereum !== 'undefined' &&
         window.ethereum.isMetaMask === true;
};

// Get MetaMask install URL
export const getMetaMaskInstallUrl = (): string => {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Chrome')) {
    return 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';
  } else if (userAgent.includes('Firefox')) {
    return 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/';
  } else if (userAgent.includes('Safari')) {
    return 'https://apps.apple.com/us/app/metamask/id1438144202';
  }

  return 'https://metamask.io/download/';
};

// Content type detection
export const getContentType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();

  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoTypes = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'md'];

  if (imageTypes.includes(ext || '')) return 'image';
  if (videoTypes.includes(ext || '')) return 'video';
  if (audioTypes.includes(ext || '')) return 'audio';
  if (documentTypes.includes(ext || '')) return 'document';

  return 'file';
};

// Price validation
export const isValidPrice = (price: string): boolean => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num < 1000000; // Max 1M FIL
};

// Truncate address for display
export const truncateAddress = (address: string, chars: number = 6): string => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Truncate CID for display
export const truncateCID = (cid: string, chars: number = 8): string => {
  if (!cid) return '';
  if (cid.length <= chars * 2) return cid;
  return `${cid.slice(0, chars)}...${cid.slice(-chars)}`;
};
