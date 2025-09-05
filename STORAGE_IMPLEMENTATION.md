# Prompt and Image Storage Implementation

## Overview
This implementation adds persistent storage functionality to the Base0 application, allowing users to save their prompts and generated images. The system uses localStorage as a temporary solution with plans for future Filecoin integration via the Synapse SDK.

## Features Implemented

### 1. Extended useSynapseStorage Hook
**File**: `/src/hooks/useSynapseStorage.ts`

**New Functions Added**:
- `savePrompt(prompt: UserPrompt)` - Saves user prompts with metadata
- `saveGeneratedImage(image: GeneratedImage)` - Saves generated image metadata
- `getUserPrompts(userId?: string)` - Retrieves user's saved prompts
- `getUserImages(userId?: string)` - Retrieves user's generated images

**Features**:
- Automatic wallet address-based storage
- Timestamp-based sorting (newest first)
- Error handling and logging
- Compatible with existing Synapse infrastructure

### 2. Automatic Storage Integration
**File**: `/src/app/playground/page.tsx`

**Implemented**:
- Automatic prompt saving when images are generated
- Enhanced prompt context (includes base image information)
- Generated image metadata storage
- Non-blocking async storage (doesn't interrupt user experience)
- Storage status indicator in UI

**Data Saved**:
- Original and enhanced prompts
- Image generation parameters (width, height, style, version)
- Base image URLs (when applicable)
- Generation timestamps
- Node context information

### 3. History Viewing Interface
**File**: `/src/app/history/page.tsx`

**Features**:
- Tabbed interface for prompts and images
- Grid view for generated images
- Detailed prompt view with related images
- Responsive design
- Navigation back to playground
- Wallet address display
- Statistics (total images/prompts)

### 4. UI Enhancements
**Playground Navigation**:
- "View History" button to access saved content
- "Logout" button for easy wallet disconnection
- Storage status indicator when saving

## Data Structure

### UserPrompt Interface
```typescript
{
  id: string;           // Unique identifier
  userId: string;       // Wallet address
  prompt: string;       // Original user prompt
  enhancedPrompt: string; // Enhanced with context
  baseImageUrl?: string; // Reference image if used
  timestamp: number;    // Creation time
  metadata: {           // Generation parameters
    width: number;
    height: number;
    version: string;
    preference: string;
  };
}
```

### GeneratedImage Interface
```typescript
{
  id: string;          // Unique identifier
  userId: string;      // Wallet address
  promptId: string;    // Links to UserPrompt
  imageUrl: string;    // Generated image URL
  shareUrl?: string;   // Optional sharing URL
  deepaiId: string;    // DeepAI response ID
  timestamp: number;   // Generation time
  metadata: any;       // Additional metadata
}
```

## Storage Strategy

### Current Implementation (MVP)
- **Storage**: Browser localStorage
- **Key Format**: `prompts_{walletAddress}` and `images_{walletAddress}`
- **Data Format**: JSON arrays with timestamps
- **Benefits**: Fast, reliable, works offline

### Future Filecoin Integration
The hook is designed for easy migration to Synapse SDK:

```typescript
// TODO: Replace localStorage with Synapse calls
// await synapseClient.store({
//   path: `prompts/${address}/${prompt.id}`,
//   data: storageData,
//   metadata: { type: 'user_prompt', version: '1.0' }
// });
```

## Usage Examples

### Saving Data (Automatic)
```typescript
// Automatically triggered when images are generated
const result = await generateImage(prompt, options);
if (result) {
  // Creates and saves UserPrompt and GeneratedImage
  await savePrompt(promptData);
  await saveGeneratedImage(imageData);
}
```

### Retrieving Data
```typescript
const { getUserPrompts, getUserImages } = useSynapseStorage();

// Get all user prompts (sorted by timestamp)
const prompts = await getUserPrompts();

// Get all user images
const images = await getUserImages();

// Get images for specific prompt
const relatedImages = images.filter(img => img.promptId === promptId);
```

## Benefits for Hackathon

1. **User Experience**: Users can track their creative process and revisit successful prompts
2. **Data Persistence**: No more lost work when browser closes
3. **Portfolio Building**: Users can build a portfolio of their AI-generated content
4. **Iteration Support**: Easy to see what worked and iterate on successful prompts
5. **Filecoin Ready**: Architecture prepared for decentralized storage migration

## Future Enhancements

1. **Export Functionality**: Allow users to export their data
2. **Search and Filter**: Find specific prompts or images
3. **Sharing**: Public galleries and sharing capabilities
4. **Analytics**: Usage statistics and generation insights
5. **Backup/Restore**: Cross-device synchronization via Filecoin

## Testing

### Manual Testing Steps
1. Connect wallet in playground
2. Generate images with different prompts
3. Check storage indicator appears during save
4. Navigate to History page
5. Verify prompts and images are displayed
6. Test tab switching between prompts and images
7. Verify data persists across page refreshes

### Browser DevTools
- Check localStorage for saved data: `localStorage.getItem('prompts_{address}')`
- Monitor console for storage logs and any errors
- Verify network requests for image generation still work

## Implementation Notes

- Storage operations are non-blocking to maintain smooth UX
- Error handling prevents storage failures from breaking image generation
- Timestamps use JavaScript Date.now() for consistency
- Unique IDs generated with timestamp + random string for collision prevention
- Compatible with existing Synapse infrastructure for easy future migration
