
# Support Multiple File Uploads

## Problem
The upload modal is hardcoded for single-file uploads:
- `maxFiles: 1` on the dropzone (line 128)
- State holds a single `File | null` instead of an array (line 80)
- `onDrop` only takes the first file (line 117)
- `handleSubmitFile` uploads and creates one material record

## Solution
Refactor the upload modal to accept and process multiple files in one go.

## Technical Changes

### File: `src/components/materials/UploadMaterialModal.tsx`

1. **Change file state from single to array**
   - `const [file, setFile] = useState<File | null>(null)` becomes `const [files, setFiles] = useState<File[]>([])`

2. **Update dropzone config**
   - Remove `maxFiles: 1` (or set to a reasonable limit like 10)
   - Update `onDrop` to append all accepted files: `setFiles(prev => [...prev, ...acceptedFiles])`
   - Auto-set title only if empty and exactly one file is dropped

3. **Update the file preview area**
   - Instead of showing a single file, show a list/stack of selected files
   - Each file gets a remove button that filters it out of the array
   - Show file count (e.g., "3 files selected")

4. **Update `handleSubmitFile` to loop through all files**
   - For each file in the array, upload to storage then call `createMaterial.mutateAsync`
   - Since the pipeline is already fire-and-forget, each call returns instantly after DB insert
   - Use a sequential loop (not `Promise.all`) to avoid overwhelming storage uploads
   - If one file fails, continue with the rest and report partial failures

5. **Update title handling**
   - When multiple files are selected, auto-generate the title per file (use filename without extension)
   - The manual title field can serve as a prefix or be hidden when multiple files are selected

6. **Update `canSubmit` and `resetForm`**
   - `canSubmit`: check `files.length > 0` instead of `file`
   - For multi-file, title can be auto-derived so don't require manual title input
   - `resetForm`: set `files` to `[]`

7. **Update document limit check**
   - Compare `materialCount + files.length` against `maxDocuments` to prevent exceeding the limit
   - Show a warning if selecting more files than remaining slots

## UI Behavior
- User drops or selects multiple files
- Files appear as a compact list with individual remove buttons
- Single "Upload All" button processes them sequentially
- Modal closes after all uploads complete
- Each material appears on the materials page with "processing" status
- A toast confirms "X materials uploaded successfully"
