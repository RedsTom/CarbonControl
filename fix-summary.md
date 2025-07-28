# Fix Summary: Checkbox Selection Error

## Problem
When clicking the checkbox next to print files, the following error occurred:
```
Unhandled Runtime Error
TypeError: props.handleSelectFile is not a function
```

## Root Cause
The `PrintFilesTab` component was calling several handler functions that were not being passed in the props spread:

1. `handleSelectFile` - for selecting individual files
2. `handleSelectFolder` - for selecting individual folders  
3. `handleDeleteSelected` - for deleting selected items
4. `handleSwitchStorage` - for switching between storage types
5. `handleFileUpload` - for file upload functionality
6. `handleEnterFolder` - for entering folders
7. `handleBack` - for going back in folder navigation
8. `loadFileList` - for refreshing the file list

## Solution
Added the missing handler functions to the props being passed to the `PrintFilesTab` component:

```typescript
<PrintFilesTab
  {...{
    // ... existing props ...
    handleSelectFile,
    handleSelectFolder,
    handleDeleteSelected,
    handleSwitchStorage,
    handleFileUpload,
    handleEnterFolder,
    handleBack,
    loadFileList,
    // ... rest of props ...
  }}
/>
```

## Files Modified
- `CarbonControl/app/page.tsx` - Added missing handler functions to props spread

## Testing
After this fix:
- ✅ File selection checkboxes should work properly
- ✅ Folder selection checkboxes should work properly
- ✅ Delete selected functionality should work
- ✅ File upload should work
- ✅ Folder navigation should work
- ✅ Storage switching should work
- ✅ File list refresh should work

## Status
**Fixed** - The checkbox selection error should now be resolved. 