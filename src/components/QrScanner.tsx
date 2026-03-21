'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);

  useEffect(() => {
    // Check if BarcodeDetector is supported
    if (!('BarcodeDetector' in window)) {
      setIsSupported(false);
      return;
    }

    const initCamera = async () => {
      try {
        setIsScanning(true);
        setError(null);

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Create BarcodeDetector instance
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
        detectorRef.current = detector;

        // Start scanning
        const scanInterval = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            return;
          }

          try {
            const results = await detector.detect(videoRef.current);
            if (results && results.length > 0) {
              const code = results[0].rawValue;
              clearInterval(scanInterval);
              stopStream();
              onScan(code);
            }
          } catch (err) {
            // Detection error, continue scanning
          }
        }, 300);

        return () => {
          clearInterval(scanInterval);
          stopStream();
        };
      } catch (err: any) {
        setIsScanning(false);
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access to scan QR codes.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Failed to access camera. Please try again.');
        }
      }
    };

    initCamera();

    return () => {
      stopStream();
    };
  }, [onScan]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <div>
            <h2 className="font-bold text-lg mb-2" style={{ color: '#1A3C5E' }}>
              Camera Scanning Not Supported
            </h2>
            <p className="text-gray-600 text-sm">
              Your browser doesn't support QR code scanning. Please type the code manually or use a modern browser (Chrome, Edge, Safari on iOS 16+).
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto text-2xl">
            ❌
          </div>
          <div>
            <h2 className="font-bold text-lg mb-2 text-red-600">
              Camera Error
            </h2>
            <p className="text-gray-600 text-sm">
              {error}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-primary w-full"
          >
            Close & Use Manual Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0% {
            top: 0;
          }
          100% {
            top: 256px;
          }
        }
        .scan-line {
          animation: scanLine 2s infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-sm">
          {/* Video Container */}
          <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Animated Scanning Line */}
            <div
              className="absolute left-0 w-full h-1 scan-line"
              style={{
                background: 'linear-gradient(to bottom, rgba(14, 124, 123, 0), #0E7C7B, rgba(14, 124, 123, 0))',
                boxShadow: '0 0 20px rgba(14, 124, 123, 0.8)',
              }}
            />

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
          </div>

          {/* Instructions */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-white font-semibold text-lg">Point camera at QR code</p>
            {isScanning && (
              <p className="text-teal-300 text-sm animate-pulse">Scanning...</p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
