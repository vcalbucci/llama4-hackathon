import os
import requests
import base64
import json
from dotenv import load_dotenv

load_dotenv()

# The folder where you have stored your test images
IMAGE_FOLDER = 'test_images'
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "https://api.llama.com/v1/chat/completions")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")

def image_to_base64(image_path):
  """Converts an image file to a base64 encoded string."""
  with open(image_path, "rb") as img:
    return base64.b64encode(img.read()).decode('utf-8')

def test_image_translation():
    """
    Finds images in the IMAGE_FOLDER, sends them to the local API,
    and prints the response.
    """
    if not os.path.isdir(IMAGE_FOLDER):
        print(f"Error: The directory '{IMAGE_FOLDER}' was not found.")
        print("Please create it and add some images to test the pipeline.")
        return

    image_files = [f for f in os.listdir(IMAGE_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]

    if not image_files:
        print(f"No images found in '{IMAGE_FOLDER}'. Please add some images to test.")
        return

    print(f"Found {len(image_files)} images to test.")

    for image_file in image_files:
        image_path = os.path.join(IMAGE_FOLDER, image_file)
        print(f"--- Processing {image_path} ---")

        try:
            # Parse filename like `{language}_{context}_...`
            filename_without_ext, _ = os.path.splitext(image_file)
            parts = filename_without_ext.split('_')
            
            if len(parts) < 2:
                print(f"Skipping {image_file}: Filename format must be 'language_context_...ext'")
                continue

            language, context = parts[0], parts[1]
            
            # Dynamically create the prompt based on your recent changes
            if context.lower() == 'translate':
                prompt = f"You are a language translator.What is the object in this image? Provide a direct translation of the text in the image into {language}."
            elif context.lower() == 'describe':
                prompt = f"You are a tour guide. You are looking at an image and describing it in {language}."
            else:
                prompt = f"Describe this image for a sign language app in {language}."

            print(f"Generated Prompt: {prompt}")

            base64_image = image_to_base64(image_path)

            if not LLAMA_API_KEY:
                print("Error: LLAMA_API_KEY not found in environment. Please check your .env file.")
                return

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
            response.raise_for_status() # Raise an exception for bad status codes

            print("API Response:")
            # Pretty-print the JSON response
            print(json.dumps(response.json(), indent=2))

        except requests.exceptions.RequestException as e:
            print(f"An error occurred while calling the API: {e}")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        
        print("-" * (len(image_path) + 18))


if __name__ == '__main__':
    test_image_translation() 