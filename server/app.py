from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "https://api.llama.com/v1/chat/completions")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")
PORT = os.getenv("PORT", 5050)


def process_image_with_llama(base64_image, language="English"):
    """
    Processes an image using the Llama API to get a translation and context.

    Args:
        base64_image (str): The base64 encoded image string.
        language (str): The target language for the translation and context.

    Returns:
        dict: A dictionary containing the API response or an error message.
              On success, it has a "success" key and a "result" key with the model's output.
              On failure, it has an "error" key with a description of the issue.
    """
    try:
        # Prompt
        prompt = f"""You are an expert translator and image analyst. Do not mention the user is using a smartphone, how the image was taken, or any information about how the image might have been obtained. Analyze the provided image and return a JSON object with two keys: "translation" and "context".
        - "translation": Provide a direct, literal translation of any and all text visible in the image into {language}. If there is no text, return an empty string.
        - "context": Provide a context of the image in {language}. Attempt to describe the image by using the surrounding context to the main subject of the image.
        Respond only with the valid JSON object. Keep the response short and concise. Your responses should be able to be read within 20 seconds. Assume the user is always using a smartphone to take the image.
        
        """

        # Ensure API key
        if not LLAMA_API_KEY:
            return {"error": "LLAMA_API_KEY not found in environment"}

        # Set headers
        headers = {
            "Authorization": f"Bearer {LLAMA_API_KEY}",
            "Content-Type": "application/json",
        }

        # Set payload
        payload = {
            "model": "Llama-4-Maverick-17B-128E-Instruct-FP8",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                },
            ],
        }

        # Send request to Llama API
        response = requests.post(LLAMA_API_URL, headers=headers, json=payload)
        response.raise_for_status()

        # Get response from Llama API
        model_response = response.json()

        # Return response
        return {"success": True, "result": model_response}

    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


@app.route("/process-image", methods=["POST"])
def process_image():
    """
    Endpoint to receive image from React app and process it.

    Args:
        image (str): The base64 encoded image string.
        language (str): The target language for the translation and context.

    Returns:
        dict: A dictionary containing the API response or an error message.
              On success, it has a "success" key and a "result" key with the model's output.
              On failure, it has an "error" key with a description of the issue.
    """
    try:
        # Get data from request
        data = request.get_json()

        # Check if image data is provided
        if not data or "image" not in data:
            return jsonify({"error": "No image data provided"}), 400

        # Extract base64 image data for the model
        image_data = data["image"]
        if image_data.startswith("data:image"):
            image_data = image_data.split(",")[1]

        # Get optional parameters
        language = data.get("language", "English")

        # Call the model and process the image
        result = process_image_with_llama(image_data, language)

        # Return result
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint.

    Returns:
        dict: A dictionary containing the status of the server.
    """
    return jsonify({"status": "healthy"})


@app.route("/text-to-speech", methods=["POST"])
def text_to_speech():
    """
    Converts text to speech using OpenAI API.
    Expects JSON: { "text": "string", "voice": "alloy" }
    """
    try:
        data = request.get_json()
        text = data.get("text")
        voice = data.get("voice", "alloy")
        if not text:
            return jsonify({"error": "No text provided"}), 400
        if not OPENAI_API_KEY:
            return jsonify({"error": "OPENAI_API_KEY not set"}), 500

        response = requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini-tts",  # or "tts-1" if you prefer
                "input": text,
                "voice": voice,
            },
        )
        response.raise_for_status()
        audio_bytes = response.content
        return send_file(
            io.BytesIO(audio_bytes),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="speech.mp3",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=PORT)
