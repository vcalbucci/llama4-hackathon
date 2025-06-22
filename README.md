# 🌍 WorldView

A real-time camera application that captures images and analyzes them using the Llama API. The app includes a React frontend for camera interaction and a Flask backend for image processing.

## Features

- Real-time camera feed
- Image capture functionality
- Multiple language support
- Different analysis contexts (Description, Translation, Sign Language)
- Integration with Llama API for image analysis
- Modern, responsive UI

## Demo

[Watch a demo of the application on YouTube](https://www.youtube.com/watch?v=Ozh4j8MfIec)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- npm (usually comes with Node.js)
- pip (Python package manager)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/vcalbucci/llama.git
   cd llama
   ```

2. Create a `.env` file in the root directory with your Llama API credentials:
   ```
   LLAMA_API_URL=https://api.llama.com/v1/chat/completions
   LLAMA_API_KEY=your_api_key_here
   ```

## Installation

1. Install global Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Node.js dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   ```

## Running the Application

You can run the application in two ways:

### Option 1: Run Frontend and Backend Together (Recommended)
From the root directory:
```bash
npm run dev:full
```
This will start both the React frontend and Flask backend servers simultaneously.

### Option 2: Run Servers Separately

1. Start the Flask backend server:
   ```bash
   # From the root directory
   npm run server
   # Or directly:
   cd server
   python app.py
   ```

2. Start the React frontend development server:
   ```bash
   # From the root directory
   npm run dev
   # Or directly:
   cd client
   npm start
   ```

## Accessing the Application

- Frontend: Open [http://localhost:5050](http://localhost:5050) in your browser
- Backend: Runs on http://localhost:5050

### Prerequisites

- Node.js and npm
- Python 3.x and pip
- Llama API Key

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Set up the backend:**

    ```bash
    cd server
    pip install -r requirements.txt
    cp .env.example .env 
    # Add your LLAMA_API_KEY to the .env file
    ```

3.  **Set up the frontend:**

    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the backend server:**

    ```bash
    cd ../server
    python app.py
    ```

2.  **Start the frontend development server:**

    ```bash
    cd ../client
    npm start
    ```

### Troubleshooting

- If you encounter any issues, please check the following:
  - Check if the ports (5050) are available
  - Ensure that you have the correct Llama API key in your `.env` file
  - Check the browser console and terminal for any error messages

## Using the Application

1. Allow camera access when prompted by your browser
2. Use the controls to:
   - Start/Stop the camera
   - Switch between front and back cameras (if available)
   - Select the desired language for analysis
   - Choose the analysis context (Describe, Translate, Sign Language)
3. Click "Capture & Analyze" to take a picture and get AI analysis
4. View the results below the camera feed

## Project Structure

```
llama/
├── client/               # React frontend
│   ├── src/
│   │   ├── CameraFeed.js
│   │   └── ...
│   └── package.json
├── server/              # Flask backend
│   ├── app.py
│   └── requirements.txt
├── test_pipeline.py     # Image processing logic
├── package.json         # Root package.json
└── requirements.txt     # Global Python requirements
```

## Troubleshooting

1. **Camera not working?**
   - Ensure you've granted camera permissions in your browser
   - Try using a different browser (Chrome recommended)
   - Check if another application is using the camera

2. **Image analysis not working?**
   - Verify the Flask server is running (check http://localhost:5000/health)
   - Ensure your `.env` file contains valid Llama API credentials
   - Check the browser console for any error messages

3. **Server won't start?**
   - Make sure all dependencies are installed
   - Check if the ports (3000 and 5000) are available
   - Verify Python and Node.js versions meet requirements

## License

[License details here]