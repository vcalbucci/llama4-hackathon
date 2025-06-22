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
  const [processingError, setProcessingError] = useState(null);
  const [processedResult, setProcessedResult] = useState(null);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [captureHistory, setCaptureHistory] = useState([]);
  const [currentCaptureData, setCurrentCaptureData] = useState(null);
  const [lightboxData, setLightboxData] = useState(null);
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isTtsOn, setIsTtsOn] = useState(true);
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);
  const audioRef = useRef(null);
  const resultContainerRef = useRef(null);

  const languageOptions = {
    'English': '🇺🇸 English',
    'Spanish': '🇪🇸 Spanish',
    'French': '🇫🇷 French',
    'German': '🇩🇪 German',
    'Italian': '🇮🇹 Italian',
    'Portuguese': '🇵🇹 Portuguese',
    'Chinese': '🇨🇳 Chinese',
    'Japanese': '🇯🇵 Japanese',
    'Korean': '🇰🇷 Korean',
  };

  // Get translated labels based on selected language
  const getLabels = (lang) => {
    const labels = {
      'English': {
        text: 'Translation',
        description: 'Context',
        noText: 'No text detected in image',
        history: 'History',
        viewHistory: 'View History',
        accessingCamera: 'Accessing camera...',
        cameraReady: 'Camera ready!',
        cameraFailed: 'Camera access failed. ',
        allowCamera: 'Please allow camera access and try again.',
        noCamera: 'No camera found on this device.',
        notSupported: 'Camera not supported in this browser.',
        unknownError: 'Unknown error occurred.',
        switchingCamera: 'Switching camera...',
        analyzingImage: 'Analyzing image...',
        analysisComplete: 'Analysis complete!',
        connectionFailed: 'Connection failed. Check if server is running.',
        failedToProcess: 'Failed to process image',
        processingIndicator: 'Analyzing your image...',
        yourGlance: 'Your Glance',
        previousCaptures: 'Previous Views',
        clearAll: 'Clear All',
        deleteCaptureTitle: 'Delete this capture',
        back: 'Back',
        captureImageTitle: 'Capture Image',
        globalMute: 'Mute all sounds',
        globalUnmute: 'Unmute all sounds',
      },
      'Spanish': {
        text: 'Traducción',
        description: 'Contexto',
        noText: 'No se detectó texto en la imagen',
        history: 'Historial',
        viewHistory: 'Ver Historial',
        accessingCamera: 'Accediendo a la cámara...',
        cameraReady: '¡Cámara lista!',
        cameraFailed: 'Falló el acceso a la cámara. ',
        allowCamera: 'Por favor, permite el acceso a la cámara e inténtalo de nuevo.',
        noCamera: 'No se encontró ninguna cámara en este dispositivo.',
        notSupported: 'La cámara no es compatible con este navegador.',
        unknownError: 'Ocurrió un error desconocido.',
        switchingCamera: 'Cambiando de cámara...',
        analyzingImage: 'Analizando imagen...',
        analysisComplete: '¡Análisis completo!',
        connectionFailed: 'Falló la conexión. Comprueba si el servidor está funcionando.',
        failedToProcess: 'Error al procesar la imagen',
        processingIndicator: 'Analizando tu imagen...',
        yourGlance: 'Tu Vistazo',
        previousCaptures: 'Vistas Anteriores',
        clearAll: 'Borrar Todo',
        deleteCaptureTitle: 'Eliminar esta captura',
        back: 'Atrás',
        captureImageTitle: 'Capturar Imagen',
        globalMute: 'Silenciar todos los sonidos',
        globalUnmute: 'Activar todos los sonidos',
      },
      'French': {
        text: 'Traduction',
        description: 'Contexte',
        noText: 'Aucun texte détecté dans l\'image',
        history: 'Historique',
        viewHistory: 'Voir l\'Historique',
        accessingCamera: 'Accès à la caméra...',
        cameraReady: 'Caméra prête !',
        cameraFailed: 'L\'accès à la caméra a échoué. ',
        allowCamera: 'Veuillez autoriser l\'accès à la caméra et réessayer.',
        noCamera: 'Aucune caméra trouvée sur cet appareil.',
        notSupported: 'Caméra non prise en charge par ce navigateur.',
        unknownError: 'Une erreur inconnue est survenue.',
        switchingCamera: 'Changement de caméra...',
        analyzingImage: 'Analyse de l\'image...',
        analysisComplete: 'Analyse terminée !',
        connectionFailed: 'La connexion a échoué. Vérifiez si le serveur est en cours d\'exécution.',
        failedToProcess: 'Échec du traitement de l\'image',
        processingIndicator: 'Analyse de votre image...',
        yourGlance: 'Votre Aperçu',
        previousCaptures: 'Vues Précédentes',
        clearAll: 'Tout Effacer',
        deleteCaptureTitle: 'Supprimer cette capture',
        back: 'Retour',
        captureImageTitle: 'Capturer une image',
        globalMute: 'Désactiver tous les sons',
        globalUnmute: 'Activer tous les sons',
      },
      'German': {
        text: 'Übersetzung',
        description: 'Kontext',
        noText: 'Kein Text im Bild erkannt',
        history: 'Verlauf',
        viewHistory: 'Verlauf anzeigen',
        accessingCamera: 'Greife auf Kamera zu...',
        cameraReady: 'Kamera bereit!',
        cameraFailed: 'Kamerazugriff fehlgeschlagen. ',
        allowCamera: 'Bitte erlauben Sie den Kamerazugriff und versuchen Sie es erneut.',
        noCamera: 'Keine Kamera auf diesem Gerät gefunden.',
        notSupported: 'Kamera wird in diesem Browser nicht unterstützt.',
        unknownError: 'Unbekannter Fehler aufgetreten.',
        switchingCamera: 'Wechsle Kamera...',
        analyzingImage: 'Analysiere Bild...',
        analysisComplete: 'Analyse abgeschlossen!',
        connectionFailed: 'Verbindung fehlgeschlagen. Überprüfen Sie, ob der Server läuft.',
        failedToProcess: 'Bildverarbeitung fehlgeschlagen',
        processingIndicator: 'Dein Bild wird analysiert...',
        yourGlance: 'Dein Blick',
        previousCaptures: 'Frühere Ansichten',
        clearAll: 'Alles Löschen',
        deleteCaptureTitle: 'Diese Aufnahme löschen',
        back: 'Zurück',
        captureImageTitle: 'Bild aufnehmen',
        globalMute: 'Alle Töne stummschalten',
        globalUnmute: 'Alle Töne einschalten',
      },
      'Italian': {
        text: 'Traduzione',
        description: 'Contesto',
        noText: 'Nessun testo rilevato nell\'immagine',
        history: 'Cronologia',
        viewHistory: 'Visualizza Cronologia',
        accessingCamera: 'Accesso alla fotocamera...',
        cameraReady: 'Fotocamera pronta!',
        cameraFailed: 'Accesso alla fotocamera non riuscito. ',
        allowCamera: 'Consenti l\'accesso alla fotocamera e riprova.',
        noCamera: 'Nessuna fotocamera trovata su questo dispositivo.',
        notSupported: 'Fotocamera non supportata in questo browser.',
        unknownError: 'Si è verificato un errore sconosciuto.',
        switchingCamera: 'Cambio fotocamera...',
        analyzingImage: 'Analisi dell\'immagine...',
        analysisComplete: 'Analisi completata!',
        connectionFailed: 'Connessione non riuscita. Controlla se il server è in esecuzione.',
        failedToProcess: 'Elaborazione dell\'immagine non riuscita',
        processingIndicator: 'Analisi della tua immagine...',
        yourGlance: 'Il Tuo Sguardo',
        previousCaptures: 'Visualizzazioni Precedenti',
        clearAll: 'Cancella Tutto',
        deleteCaptureTitle: 'Elimina questa cattura',
        back: 'Indietro',
        captureImageTitle: 'Cattura Immagine',
        globalMute: 'Disattiva tutti i suoni',
        globalUnmute: 'Attiva tutti i suoni',
      },
      'Portuguese': {
        text: 'Tradução',
        description: 'Contexto',
        noText: 'Nenhum texto detectado na imagem',
        history: 'Histórico',
        viewHistory: 'Ver Histórico',
        accessingCamera: 'Acessando a câmera...',
        cameraReady: 'Câmera pronta!',
        cameraFailed: 'O acesso à câmera falhou. ',
        allowCamera: 'Permita o acesso à câmera e tente novamente.',
        noCamera: 'Nenhuma câmera encontrada neste dispositivo.',
        notSupported: 'Câmera não suportada neste navegador.',
        unknownError: 'Ocorreu um erro desconhecido.',
        switchingCamera: 'Trocando de câmera...',
        analyzingImage: 'Analisando imagem...',
        analysisComplete: 'Análise concluída!',
        connectionFailed: 'A conexão falhou. Verifique se o servidor está em execução.',
        failedToProcess: 'Falha ao processar a imagem',
        processingIndicator: 'Analisando sua imagem...',
        yourGlance: 'Sua Olhada',
        previousCaptures: 'Visualizações Anteriores',
        clearAll: 'Limpar Tudo',
        deleteCaptureTitle: 'Excluir esta captura',
        back: 'Voltar',
        captureImageTitle: 'Capturar Imagem',
        globalMute: 'Silenciar todos os sons',
        globalUnmute: 'Ativar todos os sons',
      },
      'Chinese': {
        text: '翻译',
        description: '上下文',
        noText: '图像中未检测到文本',
        history: '历史',
        viewHistory: '查看历史',
        accessingCamera: '正在访问摄像头...',
        cameraReady: '摄像头准备就绪！',
        cameraFailed: '摄像头访问失败。',
        allowCamera: '请允许摄像头访问权限后重试。',
        noCamera: '此设备上未找到摄像头。',
        notSupported: '此浏览器不支持摄像头。',
        unknownError: '发生未知错误。',
        switchingCamera: '正在切换摄像头...',
        analyzingImage: '正在分析图像...',
        analysisComplete: '分析完成！',
        connectionFailed: '连接失败。请检查服务器是否正在运行。',
        failedToProcess: '图像处理失败',
        processingIndicator: '正在分析您的图像...',
        yourGlance: '您的即视',
        previousCaptures: '历史视角',
        clearAll: '全部清除',
        deleteCaptureTitle: '删除此捕获',
        back: '返回',
        captureImageTitle: '拍摄照片',
        globalMute: '静音所有声音',
        globalUnmute: '取消所有声音静音',
      },
      'Japanese': {
        text: '翻訳',
        description: 'コンテキスト',
        noText: '画像内にテキストが検出されませんでした',
        history: '履歴',
        viewHistory: '履歴を表示',
        accessingCamera: 'カメラにアクセスしています...',
        cameraReady: 'カメラの準備ができました！',
        cameraFailed: 'カメラへのアクセスに失敗しました。',
        allowCamera: 'カメラへのアクセスを許可して、もう一度お試しください。',
        noCamera: 'このデバイスにカメラが見つかりません。',
        notSupported: 'このブラウザではカメラはサポートされていません。',
        unknownError: '不明なエラーが発生しました。',
        switchingCamera: 'カメラを切り替えています...',
        analyzingImage: '画像を分析しています...',
        analysisComplete: '分析が完了しました！',
        connectionFailed: '接続に失敗しました。サーバーが実行されているか確認してください。',
        failedToProcess: '画像の処理に失敗しました',
        processingIndicator: 'あなたの画像を分析しています...',
        yourGlance: 'あなたの一瞥',
        previousCaptures: '過去の表示',
        clearAll: 'すべてクリア',
        deleteCaptureTitle: 'このキャプチャを削除',
        back: '戻る',
        captureImageTitle: '画像をキャプチャ',
        globalMute: 'すべてのサウンドをミュート',
        globalUnmute: 'すべてのサウンドのミュートを解除',
      },
      'Korean': {
        text: '번역',
        description: '컨텍스트',
        noText: '이미지에서 텍스트가 감지되지 않았습니다',
        history: '기록',
        viewHistory: '기록 보기',
        accessingCamera: '카메라에 액세스하는 중...',
        cameraReady: '카메라 준비 완료!',
        cameraFailed: '카메라 액세스에 실패했습니다. ',
        allowCamera: '카메라 액세스를 허용하고 다시 시도하십시오.',
        noCamera: '이 기기에서 카메라를 찾을 수 없습니다.',
        notSupported: '이 브라우저에서는 카메라가 지원되지 않습니다.',
        unknownError: '알 수 없는 오류가 발생했습니다.',
        switchingCamera: '카메라 전환 중...',
        analyzingImage: '이미지 분석 중...',
        analysisComplete: '분석 완료!',
        failedToProcess: '이미지 처리 실패',
        connectionFailed: '연결에 실패했습니다. 서버가 실행 중인지 확인하십시오.',
        processingIndicator: '이미지 분석 중...',
        yourGlance: '당신의 시선',
        previousCaptures: '이전 뷰',
        clearAll: '모두 지우기',
        deleteCaptureTitle: '이 캡처 삭제',
        back: '뒤로',
        captureImageTitle: '이미지 캡처',
        globalMute: '모든 소리 음소거',
        globalUnmute: '모든 소리 음소거 해제',
      }
    };
    return labels[lang] || labels['English'];
  };

  const showStatus = (message, type = 'info') => {
    setStatus({ message, type });
  };

  const labels = getLabels(language);

  const showError = (message) => {
    setStatus({ message, type: 'error' });
  };

  const startCamera = async (facingMode = 'user') => {
    try {
      showStatus(labels.accessingCamera, 'info');
      
      // Stop any existing stream
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 430 },
          height: { ideal: 932 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCurrentStream(stream);
      setCurrentFacingMode(facingMode);
      
      showStatus(labels.cameraReady, 'success');
      
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
      
      let errorMessage = labels.cameraFailed;
      
      if (error.name === 'NotAllowedError') {
        errorMessage += labels.allowCamera;
      } else if (error.name === 'NotFoundError') {
        errorMessage += labels.noCamera;
      } else if (error.name === 'NotSupportedError') {
        errorMessage += labels.notSupported;
      } else {
        errorMessage += error.message || labels.unknownError;
      }
      
      showError(errorMessage);
    }
  };

  const switchCamera = async () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    showStatus(labels.switchingCamera, 'info');
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
    setIsResultVisible(true);
    setResult(null);
    setProcessedResult(null);
    setProcessingError(null);
    showStatus(labels.analyzingImage, 'info');

    try {
      const response = await fetch('http://127.0.0.1:5051/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({
          image: imageDataUrl,
          language: language
        })
      });

      const data = await response.json();

      if (data.success) {
        // Handle the JSON response format with translation and context
        const responseData = data.result || data;
        const resultData = { translation: '', description: '' };
        
        // Handle the nested structure with completion_message
        if (responseData && responseData.completion_message && responseData.completion_message.content) {
          const textContent = responseData.completion_message.content.text;
          
          try {
            // Remove markdown code block wrapper and parse JSON
            const jsonString = textContent.replace(/```json\n?|\n?```/g, '').trim();
            const parsedData = JSON.parse(jsonString);
            
            resultData.translation = parsedData.translation || '';
            resultData.description = parsedData.context || '';

          } catch (parseError) {
            resultData.translation = textContent; // Fallback to raw text
          }
        } else if (responseData && typeof responseData === 'object') {
          // Fallback for direct object structure
          resultData.translation = responseData.translation || '';
          resultData.description = responseData.context || '';

        } else if (typeof responseData === 'string') {
          resultData.translation = responseData;
        }

        setProcessedResult(resultData);
        setIsTtsOn(!isGloballyMuted);
        setProcessingError(null);
        
        // Store as current capture data (don't add to history yet)
        setCurrentCaptureData({
          id: Date.now(),
          image: imageDataUrl,
          result: resultData,
          language: language,
          timestamp: new Date().toLocaleString()
        });
        
        showStatus(labels.analysisComplete, 'success');
        
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
        const errorMsg = data.error || labels.failedToProcess;
        setProcessingError(errorMsg);
        setProcessedResult(null);
        
        // Store failed capture as current data
        setCurrentCaptureData({
          id: Date.now(),
          image: imageDataUrl,
          result: null,
          error: errorMsg,
          language: language,
          timestamp: new Date().toLocaleString()
        });
        
        showError(errorMsg);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMsg = labels.connectionFailed;
      setProcessingError(errorMsg);
      setProcessedResult(null);
      
      // Store failed capture as current data
      setCurrentCaptureData({
        id: Date.now(),
        image: imageDataUrl,
        result: null,
        error: errorMsg,
        language: language,
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

  // Text-to-speech function
  const handleTextToSpeech = async (text) => {
    setIsTtsLoading(true);
    setTtsAudioUrl(null);
    try {
      const response = await fetch('http://127.0.0.1:5051/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy' })
      });
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTtsAudioUrl(url);
    } catch (err) {
      alert('Text-to-speech failed.');
    } finally {
      setIsTtsLoading(false);
    }
  };

  const handleTtsToggle = () => {
    const isNowOn = !isTtsOn;
    setIsTtsOn(isNowOn);

    if (isNowOn) {
      // If turning on and there's a result, fetch the audio to play.
      if (processedResult && !ttsAudioUrl) {
        const { description, translation } = processedResult;
        let textToSpeak = description || '';

        if (!textToSpeak) {
          textToSpeak = translation || '';
        }

        if (textToSpeak) {
          handleTextToSpeech(textToSpeak);
        }
      }
    } else {
      // If turning off, stop any playing audio.
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setTtsAudioUrl(null);
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
    // Auto-play TTS when a new result comes in and TTS is enabled
    if (processedResult && isTtsOn) {
      const { description, translation } = processedResult;
      let textToSpeak = description || '';

      if (!textToSpeak) {
        textToSpeak = translation || '';
      }

      if (textToSpeak) {
        handleTextToSpeech(textToSpeak);
      }
    }
  }, [processedResult]); // Intentionally only run when processedResult changes

  useEffect(() => {
    // Show result container when there's a current result or history
    if (processedResult || processingError || captureHistory.length > 0) {
      setIsResultVisible(true);
    }
  }, [processedResult, processingError, captureHistory]);

  // Handle touch events with proper passive/non-passive settings
  useEffect(() => {
    const container = resultContainerRef.current;
    if (!container) return;

    // Add touch event listeners with non-passive option
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup function
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isResultVisible]);

  return (
    <div className="camera-feed">
      <div className="options">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="English">🇺🇸 English</option>
          <option value="Spanish">🇪🇸 Spanish</option>
          <option value="French">🇫🇷 French</option>
          <option value="German">🇩🇪 German</option>
          <option value="Italian">🇮🇹 Italian</option>
          <option value="Portuguese">🇵🇹 Portuguese</option>
          <option value="Chinese">🇨🇳 Chinese</option>
          <option value="Japanese">🇯🇵 Japanese</option>
          <option value="Korean">🇰🇷 Korean</option>
        </select>

          <button 
            onClick={openHistory}
            className="history-btn"
          title={labels.viewHistory}
          >
          {labels.history}
          {((currentCaptureData ? 1 : 0) + captureHistory.length > 0) && ` ⟲ ${(currentCaptureData ? 1 : 0) + captureHistory.length}`}
          </button>
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
          className={`capture-btn ${isProcessing ? 'processing' : ''}`}
          title={labels.captureImageTitle}
        >
        </button>
        <button
          onClick={() => setIsGloballyMuted(!isGloballyMuted)}
          className="control-icon-btn"
          title={isGloballyMuted ? labels.globalUnmute : labels.globalMute}
        >
          {isGloballyMuted ? '🔇' : '🔊'}
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
            onMouseDown={handleMouseDown}
          >
            {/* Current/Latest Capture */}
            {(capturedImage || isProcessing || processedResult || processingError) && (
              <div className="current-capture">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Latest Capture"
                    onClick={() => setLightboxData(currentCaptureData)}
                  />
                )}
                
                {isProcessing && (
                  <div className="processing-indicator">
                    {labels.processingIndicator}
                  </div>
                )}
                
                {processingError && (
                  <div className="error-message">
                    ❌ {processingError}
                  </div>
                )}
                
                {processedResult && (
                  <div className="llama-response">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>🌐 {labels.yourGlance}</h3>
                              <button
                        onClick={handleTtsToggle}
                                disabled={isTtsLoading}
                        className="tts-toggle-btn"
                        style={{
                          background: 'rgba(0, 122, 255, 0.1)',
                          color: '#007aff',
                          border: '1px solid rgba(0, 122, 255, 0.2)',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isTtsLoading
                          ? '...'
                          : !isTtsOn
                            ? '🔇'
                            : '🔊'}
                              </button>
                                </div>
                    <p style={{ whiteSpace: 'pre-line' }}>
                      {(() => {
                        const { translation, description } = processedResult;
                        const parts = [];
                        parts.push(`${labels.text}: ${translation || labels.noText}`);
                        if (description) {
                          parts.push(`${labels.description}: ${description}`);
                        }
                        return parts.join('\n\n');
                      })()}
                    </p>
                    {ttsAudioUrl && (
                      <audio
                        ref={audioRef}
                        src={ttsAudioUrl}
                        autoPlay={isTtsOn}
                        onEnded={() => {
                          setTtsAudioUrl(null); // Clear URL after playing
                          setIsTtsOn(false); // Turn off after playing
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            {captureHistory.length > 0 && (
              <div className="history-section">
                <div className="history-header">
                  <h3>{labels.previousCaptures}</h3>
                  <button onClick={clearHistory} className="clear-history-btn">
                    🗑️ {labels.clearAll}
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
                      
                      <img
                        src={item.image}
                        alt={`Capture from ${item.timestamp}`}
                        onClick={() => setLightboxData(item)}
                      />
                      
                      <div className="history-meta">
                        <span className="history-language">
                          {item.language === 'English' ? '🇺🇸' : 
                           item.language === 'Spanish' ? '🇪🇸' :
                           item.language === 'French' ? '🇫🇷' :
                           item.language === 'German' ? '🇩🇪' :
                           item.language === 'Italian' ? '🇮🇹' :
                           item.language === 'Portuguese' ? '🇵🇹' :
                           item.language === 'Chinese' ? '🇨🇳' :
                           item.language === 'Japanese' ? '🇯🇵' :
                           item.language === 'Korean' ? '🇰🇷' : '🌐'} {item.language}
                        </span>
                      </div>
                      
                      {item.result && (
                        <div className="history-result">
                          <p>{(() => {
                            const historyLabels = getLabels(item.language);
                            const { translation, description } = item.result;
                            const parts = [];
                            parts.push(`${historyLabels.text}: ${translation || historyLabels.noText}`);
                            if (description) {
                              parts.push(`${historyLabels.description}: ${description}`);
                            }
                            return parts.join('\n\n');
                          })()}</p>
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
      {lightboxData && (
        <div className="lightbox-overlay" onClick={() => setLightboxData(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <button onClick={() => setLightboxData(null)} className="back-button">
                {labels.back}
              </button>
            </div>
            <img src={lightboxData.image} alt="Enlarged capture" className="lightbox-image" />
            {lightboxData.result && (
              <div className="lightbox-details">
                <p>{(() => {
                  const lightboxLabels = getLabels(lightboxData.language);
                  const { translation, description } = lightboxData.result;
                  const parts = [];
                  parts.push(`${lightboxLabels.text}: ${translation || lightboxLabels.noText}`);
                  if (description) {
                    parts.push(`${lightboxLabels.description}: ${description}`);
                  }
                  return parts.join('\n\n');
                })()}</p>
              </div>
            )}
            {lightboxData.error && (
              <div className="lightbox-details error-message">
                ❌ {lightboxData.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;