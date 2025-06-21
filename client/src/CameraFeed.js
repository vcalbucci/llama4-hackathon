import React, { useState, useRef, useEffect, useCallback } from 'react';
import './CameraFeed.css';

const CameraFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState('user');
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [language, setLanguage] = useState('English');
  const [context, setContext] = useState('describe');
  const [processingError, setProcessingError] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [currentCaptureData, setCurrentCaptureData] = useState(null);
  const resultContainerRef = useRef(null);

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
  };

  const showError = (message) => {
    setStatus({ message, type: 'error' });
  };

  const startCamera = async (facingMode = 'user') => {
    try {
      showStatus('Accessing camera...', 'info');
      
      // Stop any existing stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCurrentStream(stream);
      setCurrentFacingMode(facingMode);
      
      showStatus('Camera ready!', 'success');
      
      // Hide status after 2 seconds with fade-out animation
      setTimeout(() => {
        const statusElement = document.querySelector('.status-message');
        if (statusElement) {
          statusElement.classList.add('fade-out');
          // Clear the status after animation completes
          setTimeout(() => {
            setStatus({ message: '', type: 'info' });
          }, 300);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Camera access failed. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      showError(errorMessage);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    showStatus('Switching camera...', 'info');
    await startCamera(newFacingMode);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Add previous capture to history before taking new one
    if (currentCaptureData) {
      setCaptureHistory(prev => [currentCaptureData, ...prev]);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from video to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);

    // Process the image
    processImage(imageDataUrl);
  };

  const processImage = async (imageDataUrl) => {
    setIsProcessing(true);
    setResult(null);
    setProcessedResult(null);
    setProcessingError(null);
    showStatus('Analyzing image...', 'info');

    try {
      const port = process.env.REACT_APP_PORT || '5050';
      const response = await fetch(`http://localhost:${port}/process-image`, {
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
        // Extract just the text content from the Llama response
        let textContent = '';
        if (data.result && typeof data.result === 'object') {
          if (data.result.completion_message && 
              data.result.completion_message.content && 
              data.result.completion_message.content.text) {
            textContent = data.result.completion_message.content.text;
          } else if (data.result.text) {
            textContent = data.result.text;
          }
        } else if (typeof data.result === 'string') {
          textContent = data.result;
        }

        const finalResult = textContent || 'No text content found in response';
        setProcessedResult(finalResult);
        setProcessingError(null);
        
        // Store as current capture data (don't add to history yet)
        setCurrentCaptureData({
          id: Date.now(),
          image: imageDataUrl,
          result: finalResult,
          language: language,
          context: context,
          timestamp: new Date().toLocaleString()
        });
        
        showStatus('Analysis complete!', 'success');
        
        // Auto-hide success status after 3 seconds with fade-out animation
        setTimeout(() => {
          const statusElement = document.querySelector('.status-message');
          if (statusElement) {
            statusElement.classList.add('fade-out');
            // Clear the status after animation completes
            setTimeout(() => {
              setStatus({ message: '', type: 'info' });
            }, 300);
          }
        }, 3000);
      } else {
        const errorMsg = data.error || 'Failed to process image';
        setProcessingError(errorMsg);
        setProcessedResult(null);
        
        // Store failed capture as current data
        setCurrentCaptureData({
          id: Date.now(),
          image: imageDataUrl,
          result: null,
          error: errorMsg,
          language: language,
          context: context,
          timestamp: new Date().toLocaleString()
        });
        
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMsg = 'Connection failed. Check if server is running.';
      setProcessingError(errorMsg);
      setProcessedResult(null);
      
      // Store failed capture as current data
      setCurrentCaptureData({
        id: Date.now(),
        image: imageDataUrl,
        result: null,
        error: errorMsg,
        language: language,
        context: context,
        timestamp: new Date().toLocaleString()
      });
      
      showError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle touch events for the result container
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const container = resultContainerRef.current;
    if (container) {
      container.dataset.touchStart = touch.clientY;
      container.dataset.scrollTop = container.scrollTop;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    const container = resultContainerRef.current;
    if (!container || !container.dataset.touchStart) return;

    const touch = e.touches[0];
    const startY = parseInt(container.dataset.touchStart);
    const scrollTop = parseInt(container.dataset.scrollTop);
    const diff = touch.clientY - startY;
    const threshold = window.innerHeight * 0.25; // 25vh

    // If scrolled to top and pulling down, prevent default scroll
    if (scrollTop <= 0 && diff > 0) {
      e.preventDefault();
      
      // If we've reached the threshold while dragging, trigger close animation
      if (diff > threshold && !container.dataset.closing) {
        container.dataset.closing = 'true';
        container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.transform = 'translateY(100%)';
        
        // Clean up and hide after animation
        setTimeout(() => {
          setIsResultVisible(false);
          container.style.transform = '';
          container.style.transition = '';
          delete container.dataset.closing;
          delete container.dataset.touchStart;
          delete container.dataset.scrollTop;
        }, 300);
      } else if (!container.dataset.closing) {
        // Continue normal drag if not closing
        container.style.transform = `translateY(${Math.min(diff, 200)}px)`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const container = resultContainerRef.current;
    if (!container) return;

    // If already closing, don't interfere
    if (container.dataset.closing) return;

    const transform = container.style.transform;
    const translateY = transform ? parseInt(transform.replace('translateY(', '')) : 0;
    const threshold = window.innerHeight * 0.25; // 25vh

    // Restore transition for smooth animation
    container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // If pulled down more than threshold, hide the result
    if (translateY > threshold) {
      // Animate to fully closed position first
      container.style.transform = 'translateY(100%)';
      // Then hide after animation completes
      setTimeout(() => {
        setIsResultVisible(false);
        container.style.transform = '';
        container.style.transition = '';
      }, 300);
    } else {
      // Reset transform if not closing
      container.style.transform = '';
      // Clean up after animation
      setTimeout(() => {
        container.style.transition = '';
      }, 300);
    }

    delete container.dataset.touchStart;
    delete container.dataset.scrollTop;
  }, []);

  // Handle mouse events for desktop dragging
  const handleMouseDown = useCallback((e) => {
    // Only handle mouse down on the drag handle area or top of modal
    const target = e.target;
    const container = resultContainerRef.current;
    
    if (!container) return;
    
    // Check if click is on the drag handle or top area of modal
    const rect = container.getBoundingClientRect();
    const clickY = e.clientY;
    const modalTop = rect.top;
    
    // Only allow dragging if clicking within 60px of the top of the modal
    if (clickY - modalTop > 60) return;
    
    e.preventDefault();
    container.dataset.mouseStart = e.clientY;
    container.dataset.scrollTop = container.scrollTop;
    container.style.userSelect = 'none'; // Prevent text selection while dragging
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    const container = resultContainerRef.current;
    if (!container || !container.dataset.mouseStart) return;

    const startY = parseInt(container.dataset.mouseStart);
    const scrollTop = parseInt(container.dataset.scrollTop);
    const diff = e.clientY - startY;
    const threshold = window.innerHeight * 0.25; // 25vh

    // If scrolled to top and pulling down, allow dragging
    if (scrollTop <= 0 && diff > 0) {
      e.preventDefault();
      
      // If we've reached the threshold while dragging, trigger close animation
      if (diff > threshold && !container.dataset.closing) {
        container.dataset.closing = 'true';
        container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.transform = 'translateY(100%)';
        container.style.userSelect = '';
        
        // Remove global listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Clean up and hide after animation
        setTimeout(() => {
          setIsResultVisible(false);
          container.style.transform = '';
          container.style.transition = '';
          delete container.dataset.closing;
          delete container.dataset.mouseStart;
          delete container.dataset.scrollTop;
        }, 300);
      } else if (!container.dataset.closing) {
        // Continue normal drag if not closing
        container.style.transform = `translateY(${Math.min(diff, 200)}px)`;
        container.style.transition = 'none'; // Disable transition during drag
      }
    }
  }, []);

  const handleMouseUp = useCallback((e) => {
    const container = resultContainerRef.current;
    if (!container) return;

    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // If already closing, don't interfere
    if (container.dataset.closing) return;

    const transform = container.style.transform;
    const translateY = transform ? parseInt(transform.replace('translateY(', '')) : 0;
    const threshold = window.innerHeight * 0.25; // 25vh

    // Restore transition for smooth animation
    container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    container.style.userSelect = '';

    // If pulled down more than threshold, hide the result
    if (translateY > threshold) {
      // Animate to fully closed position first
      container.style.transform = 'translateY(100%)';
      // Then hide after animation completes
      setTimeout(() => {
        setIsResultVisible(false);
        container.style.transform = '';
        container.style.transition = '';
      }, 300);
    } else {
      // Reset transform if not closing
      container.style.transform = '';
      // Clean up after animation
      setTimeout(() => {
        container.style.transition = '';
      }, 300);
    }

    delete container.dataset.mouseStart;
    delete container.dataset.scrollTop;
  }, []);

  const clearHistory = () => {
    setCaptureHistory([]);
    setCurrentCaptureData(null);
    // Add smooth closing animation
    const container = resultContainerRef.current;
    if (container) {
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.transform = 'translateY(100%)';
      setTimeout(() => {
        setIsResultVisible(false);
        container.style.transform = '';
        container.style.transition = '';
      }, 300);
    } else {
      setIsResultVisible(false);
    }
  };

  const deleteHistoryItem = (id) => {
    setCaptureHistory(prev => prev.filter(item => item.id !== id));
  };

  const openHistory = () => {
    if (currentCaptureData || captureHistory.length > 0) {
      setIsResultVisible(true);
    }
  };

  const closeResultContainer = () => {
    // Add smooth closing animation
    const container = resultContainerRef.current;
    if (container) {
      container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.transform = 'translateY(100%)';
      setTimeout(() => {
        setIsResultVisible(false);
        container.style.transform = '';
        container.style.transition = '';
      }, 300);
    } else {
      setIsResultVisible(false);
    }
  };



  useEffect(() => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError('Camera access not supported. Please use a modern browser.');
      return;
    }

    // Auto-start camera when component mounts
    startCamera();

    // Clean up when component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array to run only on mount

  useEffect(() => {
    // Show result container when there's a current result or history
    if (processedResult || processingError || captureHistory.length > 0) {
      setIsResultVisible(true);
    }
  }, [processedResult, processingError, captureHistory]);

  return (
    <div className="camera-feed">
      <div className="options">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="English">🌐 English</option>
          <option value="Spanish">🇪🇸 Spanish</option>
          <option value="French">🇫🇷 French</option>
          <option value="German">🇩🇪 German</option>
          <option value="Italian">🇮🇹 Italian</option>
          <option value="Portuguese">🇵🇹 Portuguese</option>
          <option value="Chinese">🇨🇳 Chinese</option>
          <option value="Japanese">🇯🇵 Japanese</option>
          <option value="Korean">🇰🇷 Korean</option>
        </select>

        <select value={context} onChange={(e) => setContext(e.target.value)}>
          <option value="describe">👁️ Describe</option>
          <option value="translate">🔤 Translate</option>
        </select>

        {(currentCaptureData || captureHistory.length > 0) && (
          <button 
            onClick={openHistory}
            className="history-btn"
            title="View History"
          >
            History ⟲ {captureHistory.length}
          </button>
        )}
      </div>

      {status.message && (
        <div className="status-message" data-type={status.type}>
          {status.message}
        </div>
      )}

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: currentFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="controls">
        <button 
          onClick={captureImage} 
          disabled={isProcessing}
          className={isProcessing ? 'processing' : ''}
          title="Capture Image"
        >
        </button>
      </div>

      {(processedResult || processingError || isProcessing || captureHistory.length > 0) && isResultVisible && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="backdrop-overlay"
            onClick={closeResultContainer}
          />
          
          <div 
            ref={resultContainerRef}
            className={`result-container ${!isResultVisible ? 'hidden' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            {/* Current/Latest Capture */}
            {(capturedImage || isProcessing || processedResult || processingError) && (
              <div className="current-capture">
                {capturedImage && (
                  <img src={capturedImage} alt="Latest Capture" />
                )}
                
                {isProcessing && (
                  <div className="processing-indicator">
                    Analyzing your image...
                  </div>
                )}
                
                {processingError && (
                  <div className="error-message">
                    ❌ {processingError}
                  </div>
                )}
                
                {processedResult && (
                  <div className="llama-response">
                    <h3>✨ Analysis Result</h3>
                    <p>{processedResult}</p>
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            {captureHistory.length > 0 && (
              <div className="history-section">
                <div className="history-header">
                  <h3>⟲ Previous Captures</h3>
                  <button onClick={clearHistory} className="clear-history-btn">
                    🗑️ Clear All
                  </button>
                </div>
                
                <div className="history-list">
                  {captureHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-item-header">
                        <span className="history-timestamp">{item.timestamp}</span>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="delete-item-btn"
                          title="Delete this capture"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <img src={item.image} alt={`Capture from ${item.timestamp}`} />
                      
                      <div className="history-meta">
                        <span className="history-language">🌐 {item.language}</span>
                        <span className="history-context">
                          {item.context === 'describe' ? '👁️ Describe' : '🔤 Translate'}
                        </span>
                      </div>
                      
                      {item.result && (
                        <div className="history-result">
                          <p>{item.result}</p>
                        </div>
                      )}
                      
                      {item.error && (
                        <div className="history-error">
                          ❌ {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraFeed; 