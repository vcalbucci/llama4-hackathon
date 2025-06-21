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
        setProcessedResult(data.result);
        setProcessingError(null);
        showStatus('Image processed successfully!', 'success');
      } else {
        setProcessingError(data.error || 'Failed to process image');
        setProcessedResult(null);
        showError(data.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessingError('Failed to connect to processing server. Make sure the server is running.');
      setProcessedResult(null);
      showError('Failed to connect to processing server. Make sure the server is running.');
    } finally {
      setIsProcessing(false);
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
    <div className="camera-feed">
      <div className="controls">
        <button onClick={() => !isStarted ? startCamera() : stopCamera()}>
          {!isStarted ? 'Start Camera' : 'Stop Camera'}
        </button>
        {isStarted && (
          <>
            <button onClick={switchCamera}>Switch Camera</button>
            <button onClick={captureImage} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Capture Image'}
            </button>
          </>
        )}
      </div>

      <div className="options">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
          <option value="Italian">Italian</option>
          <option value="Portuguese">Portuguese</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
          <option value="Korean">Korean</option>
        </select>

        <select value={context} onChange={(e) => setContext(e.target.value)}>
          <option value="describe">Describe</option>
          <option value="translate">Translate</option>
        </select>
      </div>

      <div className="status-message" data-type={status.type}>
        {status.message}
      </div>

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {capturedImage && (
        <div className="result-container">
          <h3>Captured Image</h3>
          <img
            src={capturedImage}
            alt="Captured"
            style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          {isProcessing && (
            <div className="processing-indicator">
              Processing image...
            </div>
          )}
          
          {processingError && (
            <div className="error-message">
              {processingError}
            </div>
          )}
          
          {processedResult && (
            <div className="llama-response">
              <h3>Llama Response:</h3>
              <p>{processedResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraFeed; 