import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

LANDING_AI_API_KEY = os.getenv('LANDING_AI_API_KEY')
PARSE_API_URL = 'https://api.va.landing.ai/v1/ade/parse'
EXTRACT_API_URL = 'https://api.va.landing.ai/v1/ade/extract'


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/parse', methods=['POST'])
def parse_pdf():
    """
    Parse a PDF file into text using Landing AI API
    Expects: multipart/form-data with 'file' field
    Returns: parsed text content
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400

    try:
        # Prepare the file for Landing AI API
        files = {'document': file}
        headers = {
            'Authorization': f'Bearer {LANDING_AI_API_KEY}'
        }
        data = {
            'model': 'dpt-2-latest'
        }

        # Call Landing AI parse API
        response = requests.post(PARSE_API_URL, files=files, data=data, headers=headers)
        response.raise_for_status()

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Landing AI API error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/api/extract', methods=['POST'])
def extract_data():
    """
    Extract structured data from markdown using Landing AI API
    Expects: JSON body with 'markdown' (text content) and 'schema' (JSON schema defining fields)
    Returns: extracted structured data
    """
    data = request.get_json()

    if not data or 'markdown' not in data or 'schema' not in data:
        return jsonify({'error': 'Missing required fields: markdown and schema'}), 400

    try:
        import json
        import io

        # Create a file-like object from the markdown text
        markdown_file = io.BytesIO(data['markdown'].encode('utf-8'))

        headers = {
            'Authorization': f'Bearer {LANDING_AI_API_KEY}'
        }

        # Prepare the schema as a JSON string
        schema_str = json.dumps(data['schema']) if isinstance(data['schema'], dict) else data['schema']

        files = {'markdown': markdown_file}
        form_data = {
            'schema': schema_str,
            'model': 'extract-latest'
        }

        # Call Landing AI extract API
        response = requests.post(EXTRACT_API_URL, files=files, data=form_data, headers=headers)
        response.raise_for_status()

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Landing AI API error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
