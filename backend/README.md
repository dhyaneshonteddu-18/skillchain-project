# SkillChain Backend - IPFS Upload Service

This is a simple Express.js backend that provides secure IPFS upload functionality for the SkillChain application.

## Purpose

- Secure file uploads to Pinata IPFS
- Keep Pinata API keys safe (never exposed in frontend code)
- Compute file hashes for blockchain verification
- Handle file validation and error responses

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Pinata credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Pinata API credentials:
```
PINATA_API_KEY=your_key_here
PINATA_API_SECRET=your_secret_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**How to get Pinata credentials:**
1. Go to https://pinata.cloud
2. Sign up for a free account
3. Create API keys under Account → API Keys
4. Copy the API Key and API Secret into `.env`

### 3. Start the Backend

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### 1. Health Check
**GET** `/api/health`

Check if the backend is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

### 2. IPFS File Upload
**POST** `/api/ipfs/upload`

Upload a certificate or document to Pinata IPFS.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form with `file` field containing the file to upload

**File Requirements:**
- Supported formats: PDF, PNG, JPG, GIF
- Max size: 10MB

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/ipfs/upload \
  -F "file=@/path/to/certificate.pdf"
```

**JavaScript Fetch Example:**
```javascript
const formData = new FormData();
formData.append('file', fileInputElement.files[0]);

const response = await fetch('http://localhost:3001/api/ipfs/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// Returns: { success: true, ipfsCid: "Qm...", hash: "0x...", fileName, fileSize }
```

**Success Response (200):**
```json
{
  "success": true,
  "ipfsCid": "QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "hash": "0xabcdef...",
  "fileName": "certificate.pdf",
  "fileSize": 245000,
  "message": "File uploaded successfully"
}
```

**Error Responses:**
- 400: No file provided
- 401: Invalid Pinata credentials
- 413: File too large (> 10MB)
- 415: Invalid file type
- 500: Server error

## Frontend Integration

### Update `.env.local` in Frontend

Add the backend URL:
```
VITE_API_URL=http://localhost:3001
```

### Use in React Component

```javascript
import { useState } from 'react';

export default function CertificateUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ipfs/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setResult({
          ipfsCid: data.ipfsCid,
          hash: data.hash,
          fileName: data.fileName,
        });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".pdf,.png,.jpg,.jpeg,.gif"
      />
      <button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {result && (
        <div>
          <p>IPFS CID: {result.ipfsCid}</p>
          <p>Hash: {result.hash}</p>
          <p>File: {result.fileName}</p>
        </div>
      )}
    </div>
  );
}
```

## Security Features

✅ API keys never logged or exposed  
✅ File size limits enforced (10MB max)  
✅ MIME type validation (PDF, PNG, JPG, GIF only)  
✅ CORS restricted to frontend origin  
✅ Multer memory storage (no temp files on disk)  
✅ Rate limiting ready (add: npm install express-rate-limit)

## Troubleshooting

### "Pinata credentials not configured"
- Check `.env` file exists
- Verify `PINATA_API_KEY` and `PINATA_API_SECRET` are set
- Restart the server after updating `.env`

### "Invalid Pinata credentials"
- Double-check API key and secret from Pinata dashboard
- Ensure no extra whitespace in `.env`
- Regenerate keys if needed

### CORS error in browser
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Default is `http://localhost:5173` (Vite dev server)
- If frontend runs elsewhere, update `.env`

### File upload timeout
- Check file size (max 10MB)
- Check internet connection to Pinata
- Try uploading again

## Next Steps

1. Install dependencies: `npm install`
2. Configure Pinata credentials in `.env`
3. Start backend: `npm run dev`
4. Update frontend `.env.local` with `VITE_API_URL`
5. Implement file upload in frontend components
6. Test with: `curl -X GET http://localhost:3001/api/health`

## Development Notes

- Backend runs independently of frontend
- Can test API with Postman, cURL, or browser DevTools
- All file uploads go to Pinata IPFS (not local disk)
- Hash computation will be moved to frontend (ethers.js keccak256) in next phase
