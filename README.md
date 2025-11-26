# PDF Data Extractor

A web application that extracts structured data from PDF files using AI-powered parsing and extraction via the Landing AI API.

## Features

- Upload PDF files through a user-friendly interface
- View PDFs directly in the browser with page navigation and zoom controls
- Configure custom fields to extract from PDFs
- AI-powered text parsing and structured data extraction
- Edit extracted data before export
- Export to CSV with metadata (filename, file size, parse time)
- Process multiple PDFs in parallel
- Real-time preview of extraction results
- Secure API key storage in browser cookies

## Architecture

- **Frontend-only**: Next.js (React) with TypeScript and Tailwind CSS
- **API Integration**: Direct calls to Landing AI APIs from the browser
- **PDF Viewing**: react-pdf library
- **Data Storage**: IndexedDB for field configurations

## Prerequisites

- Node.js 18+ (20.9+ recommended for Next.js)
- npm
- Landing AI API key (enter directly in the web interface)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd waste_parser
```

### 2. Install dependencies

```bash
make install
```

Or manually:

```bash
cd frontend
npm install
```

### 3. Start the development server

```bash
make dev
```

Or manually:

```bash
cd frontend
npm run dev
```

The application will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`

2. **Enter API Key** (first time only):
   - You'll see an API key input at the top of the page
   - Enter your Landing AI API key
   - Click "Save" - the key will be stored in a browser cookie
   - The key remains saved across sessions

3. **Configure Fields** (optional):
   - Click "Configure Fields" button
   - Save/load field configurations by name
   - Modify existing fields or add new ones
   - Each field needs:
     - **Name**: The field identifier (e.g., `start date`)
     - **Description**: What the AI should look for (e.g., "Start date of reporting period")
     - **Type**: Data type (string or number)

4. **Upload PDFs**:
   - Click "+ Add PDFs" to select one or more PDF files
   - Or drag and drop PDFs onto the drop zone
   - PDFs will display in a list with status indicators
   - Click any PDF in the list to preview it

5. **Extract Data**:
   - **Single file**: Select a PDF and click "Parse Selected"
   - **Multiple files**: Click "Process All" to process all PDFs in parallel
   - The app will:
     1. Parse each PDF into text using Landing AI
     2. Extract structured fields from the text
   - Status indicators show progress (○ pending, ⟳ processing, ✓ completed, ✗ error)

6. **Edit Results**:
   - Click on any completed PDF to view its extracted data
   - Modify values directly in the input fields
   - Click "Undo Changes" to reset to original extracted values

7. **Export to CSV**:
   - Click "Export to CSV" to download all completed extractions
   - CSV includes metadata: filename, file size, parse timestamp, parse duration
   - All configured fields are included as columns

## Project Structure

```
waste_parser/
├── frontend/
│   ├── app/
│   │   └── page.tsx           # Main application page
│   ├── components/
│   │   ├── PDFViewer.tsx      # PDF display component with zoom
│   │   ├── FieldConfig.tsx    # Field configuration UI
│   │   ├── ResultsEditor.tsx  # Results editing UI
│   │   └── ApiKeyInput.tsx    # API key input with cookie storage
│   ├── lib/
│   │   └── db.ts              # IndexedDB for configurations
│   ├── package.json
│   └── ...
├── Makefile                   # Build and run commands
├── .gitignore
└── README.md
```

## Landing AI APIs Used

The application calls these APIs directly from the browser:

### Parse API
- **URL**: `https://api.va.landing.ai/v1/ade/parse`
- **Purpose**: Converts PDF files into structured text
- **Model**: `dpt-2-latest`
- **Authentication**: Bearer token (your API key)

### Extract API
- **URL**: `https://api.va.landing.ai/v1/ade/extract`
- **Purpose**: Extracts structured fields from text using AI
- **Model**: `extract-latest`
- **Authentication**: Bearer token (your API key)

## Troubleshooting

### API Key Issues

- **"Please set your Landing AI API key first"**: Click on the API key input at the top of the page and enter your key
- **API key not persisting**: Check that your browser allows cookies. The key is stored in a cookie with 1-year expiration
- **401 Unauthorized**: Your API key is invalid. Click "Change" to enter a new key

### Application Issues

- **PDF not displaying**: Check browser console for errors. The PDF.js worker is loaded from CDN
- **"Failed to parse PDF"**: Check the error message for details. Common causes:
  - Invalid API key
  - Network issues
  - PDF file is corrupted or too large
  - API rate limits exceeded
- **Node version warning**: Next.js 16 requires Node.js 20.9+. The app should still work on Node 18 but upgrading is recommended

### Performance

- **Slow processing**: Large PDFs take longer to process. The Landing AI API processes them on their servers
- **Processing multiple files**: Files are processed in parallel, but may be rate-limited by the API
- **Browser tab freezing**: Processing happens asynchronously, but very large PDFs may cause temporary UI slowness

## Development

### Adding New Field Types

To add support for new field types (e.g., date, email):

1. Update the `type` options in `FieldConfig.tsx`
2. Update the input type rendering in `ResultsEditor.tsx`
3. Add any necessary validation logic

### Customizing the UI

The app uses Tailwind CSS for styling. Modify the className attributes in the components to change the appearance.

### Security Considerations

- **API Key Storage**: The API key is stored in a browser cookie with `SameSite=Strict` flag
- **No Server Storage**: API keys never touch a server - they're only stored in the user's browser
- **HTTPS in Production**: Always deploy with HTTPS to protect API keys in transit
- **Rate Limiting**: The Landing AI API has its own rate limits - consider implementing client-side throttling for high-volume use

### Building for Production

```bash
cd frontend
npm run build
npm start
```

For deployment, consider using Vercel, Netlify, or any static hosting service that supports Next.js.

## License

MIT
