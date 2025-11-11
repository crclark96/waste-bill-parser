# PDF Data Extractor

A web application that extracts structured data from PDF files using AI-powered parsing and extraction via the Landing AI API.

## Features

- Upload PDF files through a user-friendly interface
- View PDFs directly in the browser with page navigation
- Configure custom fields to extract from PDFs
- AI-powered text parsing and structured data extraction
- Edit extracted data before use
- Copy extracted data to clipboard as JSON
- Real-time preview of extraction results

## Architecture

- **Backend**: Python Flask API that interfaces with Landing AI APIs
- **Frontend**: Next.js (React) with TypeScript and Tailwind CSS
- **PDF Viewing**: react-pdf library

## Prerequisites

- Python 3.8+
- [uv](https://docs.astral.sh/uv/) - Fast Python package installer and resolver
- Node.js 18+ (20.9+ recommended for Next.js)
- npm
- Landing AI API key

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd waste_parser
```

### 2. Backend Setup

#### Install dependencies with uv

If you don't have `uv` installed, install it first:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install the Python dependencies:

```bash
uv sync
```

#### Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Landing AI API key:

```
LANDING_AI_API_KEY=your_actual_api_key_here
FLASK_PORT=5000
```

#### Start the Flask backend

```bash
uv run python backend/app.py
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal window.

#### Install Node.js dependencies

```bash
cd frontend
npm install
```

#### Start the Next.js development server

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`

2. **Configure Fields** (optional):
   - Click "Field Configuration" to expand the section
   - Modify existing fields or add new ones
   - Each field needs:
     - **Name**: The field identifier (e.g., `invoice_number`)
     - **Description**: What the AI should look for (e.g., "Invoice or receipt number")
     - **Type**: Data type (string, number, or boolean)

3. **Upload PDF**:
   - Click "Choose File" and select a PDF document
   - The PDF will display in the left panel

4. **Extract Data**:
   - Click "Parse & Extract Data"
   - The app will:
     1. Parse the PDF into text using Landing AI
     2. Extract structured fields from the text
   - Results appear in the right panel

5. **Edit Results**:
   - Modify any extracted values directly in the input fields
   - View the JSON preview at the bottom

6. **Copy to Clipboard**:
   - Click "Copy to Clipboard" to copy the JSON data
   - Paste into your application or spreadsheet

## API Endpoints

### Backend (Flask)

#### `GET /health`
Health check endpoint.

#### `POST /api/parse`
Parse a PDF file into text.
- **Input**: Multipart form data with `file` field (PDF)
- **Output**: JSON with parsed text content

#### `POST /api/extract`
Extract structured data from text.
- **Input**: JSON with `text` and `fields` array
- **Output**: JSON with extracted field values

## Project Structure

```
waste_parser/
├── backend/
│   └── app.py              # Flask backend with API endpoints
├── frontend/
│   ├── app/
│   │   └── page.tsx        # Main application page
│   ├── components/
│   │   ├── PDFViewer.tsx   # PDF display component
│   │   ├── FieldConfig.tsx # Field configuration UI
│   │   └── ResultsEditor.tsx # Results editing and clipboard copy
│   ├── package.json
│   └── ...
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── .gitignore
└── README.md
```

## Landing AI APIs Used

### Parse API
- **URL**: `https://api.va.landing.ai/v1/ade/parse`
- **Purpose**: Converts PDF files into structured text
- **Method**: POST with file upload

### Extract API
- **URL**: `https://api.va.landing.ai/v1/ade/extract`
- **Purpose**: Extracts structured fields from text using AI
- **Method**: POST with JSON payload

## Troubleshooting

### Backend Issues

- **"LANDING_AI_API_KEY not found"**: Make sure you've created the `.env` file with your API key
- **CORS errors**: The Flask app has CORS enabled for all origins during development
- **"Port 5000 is in use"**: This is commonly caused by macOS AirPlay Receiver. Either:
  - Disable AirPlay Receiver: System Settings → General → AirDrop & Handoff → AirPlay Receiver (turn off)
  - Or change the port: Edit `.env` and set `FLASK_PORT=5001` (or any other available port), then update the frontend API calls in `app/page.tsx` to match

### Frontend Issues

- **PDF not displaying**: Check browser console for errors. The PDF.js worker is loaded from CDN
- **"Failed to parse PDF"**: Ensure the backend is running on port 5000
- **Node version warning**: Next.js 16 requires Node.js 20.9+. The app should still work on Node 18 but upgrading is recommended

### API Issues

- **401 Unauthorized**: Check your Landing AI API key is correct
- **Rate limiting**: You may be hitting API rate limits
- **Parse/Extract failures**: Check the backend logs for detailed error messages

## Development

### Adding New Field Types

To add support for new field types (e.g., date, email):

1. Update the `type` options in `FieldConfig.tsx`
2. Update the input type rendering in `ResultsEditor.tsx`
3. Add any necessary validation logic

### Customizing the UI

The app uses Tailwind CSS for styling. Modify the className attributes in the components to change the appearance.

### Environment Variables

For production, consider using separate environment variables for frontend and backend, and implement proper API key validation and rate limiting.

## License

MIT
