import os
import requests
import base64
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# The folder where you have stored your test images
IMAGE_FOLDER = 'test_images'
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "https://api.llama.com/v1/chat/completions")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")

print("Debug - Environment Variables:")
print(f"API URL: {LLAMA_API_URL}")
print(f"API Key: {'Set' if LLAMA_API_KEY else 'Not Set'}")

def image_to_base64(image_path):
    """Converts an image file to a base64 encoded string."""
    with open(image_path, "rb") as img:
        return base64.b64encode(img.read()).decode('utf-8')

@app.route('/api/process-image', methods=['POST'])
def process_image():
    """
    API endpoint that processes an image and returns the Llama API response.
    Expects a JSON with:
    {
        "image_path": "path/to/image.jpg",
        "language": "target_language",
        "context": "translate|describe"
    }
    """
    try:
        print("--- Received API request ---")
        data = request.json
        print(f"Request data: {json.dumps(data, indent=2)}")
        
        image_path = data.get('image_path')
        language = data.get('language', 'English')
        context = data.get('context', 'translate')

        if not image_path:
            return jsonify({"error": "No image path provided"}), 400

        full_image_path = os.path.join(IMAGE_FOLDER, image_path)
        if not os.path.exists(full_image_path):
            return jsonify({"error": f"Image not found: {image_path}"}), 404

        # Generate the appropriate prompt based on context
        if context.lower() == 'translate':
            prompt = f"You are a language translator. What is the object in this image? Provide a direct translation of the text in the image into {language}."
        elif context.lower() == 'describe':
            prompt = f"You are a tour guide. You are looking at an image and describing it in {language}."
        else:
            prompt = f"Describe this image for a sign language app in {language}."

        print(f"Generated prompt: {prompt}")
        base64_image = image_to_base64(full_image_path)

        if not LLAMA_API_KEY:
            return jsonify({"error": "LLAMA_API_KEY not found in environment"}), 500

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

        print("Sending request to Llama API...")
        response = requests.post(LLAMA_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        response_data = response.json()
        print("\nRaw API Response:")
        print(json.dumps(response_data, indent=2))

        # Extract the actual response content from the Llama API response
        content = None
        if isinstance(response_data, dict):
            if "choices" in response_data:
                # Handle OpenAI-like format
                content = response_data["choices"][0]["message"]["content"]
            elif "message" in response_data:
                # Handle Llama API format
                if isinstance(response_data["message"], dict):
                    content = response_data["message"].get("content")
                else:
                    content = response_data["message"]
            elif "response" in response_data:
                # Another possible format
                content = response_data["response"]
            elif "output" in response_data:
                # Handle output format
                if isinstance(response_data["output"], dict):
                    content = response_data["output"].get("content")
                else:
                    content = response_data["output"]
        
        if content is None:
            print("\nCould not find content in response structure")
            content = str(response_data)  # Fallback to string representation
        else:
            print("\nExtracted Content:")
            print(content)

        return jsonify({
            "success": True,
            "response": content,
            "raw_response": response_data
        })

    except requests.exceptions.RequestException as e:
        print(f"\nAPI request error: {str(e)}")
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except Exception as e:
        print(f"\nUnexpected error: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    print(f"\nStarting Flask server...")
    print(f"Image folder path: {os.path.abspath(IMAGE_FOLDER)}")
    app.run(debug=True, port=5000) 