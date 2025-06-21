from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import requests
import json
from dotenv import load_dotenv
import tempfile
from PIL import Image
import io

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

LLAMA_API_URL = os.getenv("LLAMA_API_URL", "https://api.llama.com/v1/chat/completions")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")
PORT = os.getenv("PORT", 5000)

def process_image_with_llama(base64_image, language='English', context='describe'):
    """
    Process image using the Llama API
    """
    try:
        # Create prompt based on context
        if context.lower() == 'translate':
            prompt = f"You are a language translator. What is the object in this image? Provide a direct translation of the text in the image into {language}."
        elif context.lower() == 'describe':
            prompt = f"You are a tour guide. You are looking at an image and describing it in {language}."
        else:
            prompt = f"Describe this image for a sign language app in {language}."

        if not LLAMA_API_KEY:
            return {"error": "LLAMA_API_KEY not found in environment"}

        headers = {
            "Authorization": f"Bearer {LLAMA_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "Llama-4-Maverick-17B-128E-Instruct-FP8",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                },
            ]
        }

        response = requests.post(LLAMA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        return {
            "success": True,
            "result": result  # Pass through the raw Llama response
        }
            
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@app.route('/process-image', methods=['POST'])
def process_image():
    """
    Endpoint to receive image from React app and process it
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        # Extract base64 image data (remove data:image/jpeg;base64, prefix if present)
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Get optional parameters
        language = data.get('language', 'English')
        context = data.get('context', 'describe')
        
        # Process the image
        result = process_image_with_llama(image_data, language, context)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=PORT) 