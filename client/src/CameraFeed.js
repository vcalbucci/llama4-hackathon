import React, { useState, useRef, useEffect } from 'react';
import './CameraFeed.css';

const CameraFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState('user');
  const [status, setStatus] = useState({ message: 'Click "Start Camera" to begin.', type: 'info' });
  const [isStarted, setIsStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [language, setLanguage] = useState('English');
  const [context, setContext] = useState('describe');
  const [processingError, setProcessingError] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
  };

  const showError = (message) => {
    setStatus({ message, type: 'error' });
  };

  const startCamera = async (facingMode = 'user') => {
    try {
      showStatus('Requesting camera access...', 'info');
      
      // Stop any existing stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCurrentStream(stream);
      setCurrentFacingMode(facingMode);
      setIsStarted(true);
      
      showStatus('Camera started successfully!', 'success');
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera access was denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera access is not supported in this browser.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      showError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStarted(false);
      showStatus('Camera stopped.', 'info');
    }
  };

  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    await startCamera(newFacingMode);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from video to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);

    // Process the image
    processImage(imageDataUrl);
  };

  const processImage = async (imageDataUrl) => {
    setIsProcessing(true);
    setResult(null);
    showStatus('Processing image...', 'info');

    try {
      const response = await fetch('http://localhost:5000/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          language: language,
          context: context
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        showStatus('Image processed successfully!', 'success');
      } else {
        showError(data.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      showError('Failed to connect to processing server. Make sure the server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!capturedImage) {
      alert('Please capture an image first');
      return;
    }

    try {
      // First save the image
      const formData = new FormData();
      formData.append('image', capturedImage);
      
      const saveResponse = await fetch('/api/save-image', {
        method: 'POST',
        body: formData
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to save image');
      }
      
      const { filename } = await saveResponse.json();

      // Then process the image with Llama
      const processResponse = await fetch('http://localhost:5000/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_path: filename,
          language: language,
          context: context
        })
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process image');
      }

      const result = await processResponse.json();
      
      if (result.error) {
        setProcessingError(result.error);
        setProcessedResult(null);
      } else {
        setProcessingError(null);
        setProcessedResult(result.response);
      }

    } catch (error) {
      console.error('Error processing image:', error);
      setProcessingError(error.message);
      setProcessedResult(null);
    }
  };

  useEffect(() => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
    }

    // Clean up when component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

  return (
    <div className="camera-container">
      <h1>Camera Feed with AI Analysis</h1>
      
      <div className="camera-settings">
        <div className="setting-group">
          <label htmlFor="language">Language:</label>
          <select 
            id="language" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="setting-select"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Italian">Italian</option>
            <option value="Portuguese">Portuguese</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label htmlFor="context">Context:</label>
          <select 
            id="context" 
            value={context} 
            onChange={(e) => setContext(e.target.value)}
            className="setting-select"
          >
            <option value="describe">Describe</option>
            <option value="translate">Translate</option>
            <option value="signlanguage">Sign Language</option>
          </select>
        </div>
      </div>

      <video 
        ref={videoRef}
        id="video" 
        autoPlay 
        playsInline 
        muted
        className="camera-video"
      />
      
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      <div className="camera-controls">
        <button 
          onClick={() => startCamera()}
          disabled={isStarted}
          className="camera-btn"
        >
          Start Camera
        </button>
        <button 
          onClick={stopCamera}
          disabled={!isStarted}
          className="camera-btn"
        >
          Stop Camera
        </button>
        <button 
          onClick={switchCamera}
          disabled={!isStarted}
          className="camera-btn"
        >
          Switch Camera
        </button>
        <button 
          onClick={captureImage}
          disabled={!isStarted || isProcessing}
          className="camera-btn capture-btn"
        >
          {isProcessing ? 'Processing...' : 'Capture & Analyze'}
        </button>
      </div>
      
      {status.message && (
        <div className={`camera-status ${status.type}`}>
          {status.message}
        </div>
      )}

      {capturedImage && (
        <div className="captured-section">
          <h3>Captured Image</h3>
          <img 
            src={capturedImage} 
            alt="Captured" 
            className="captured-image"
          />
        </div>
      )}

      {result && (
        <div className="result-section">
          <h3>AI Analysis Result</h3>
          <div className="result-content">
            <div className="result-prompt">
              <strong>Prompt used:</strong> {result.prompt}
            </div>
            <div className="result-text">
              <strong>Result:</strong> {result.result}
            </div>
          </div>
        </div>
      )}

      {processingError && (
        <div className="error-message">
          Error: {processingError}
        </div>
      )}
      
      {processedResult && (
        <div className="result-container">
          <h3>Result:</h3>
          <p>{processedResult}</p>
        </div>
      )}
    </div>
  );
};

export default CameraFeed; 