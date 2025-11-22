/**
 * BarcodeScanner - Barcode scanning component using html5-qrcode
 * Saves camera preference to localStorage for faster subsequent scans
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const CAMERA_PREFERENCE_KEY = 'bitebudget_preferred_camera';

export function BarcodeScanner({ isOpen, onClose, onScan }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const readerDivRef = useRef<HTMLDivElement>(null);
  const hasScannedRef = useRef(false); // Prevent multiple scans
  const [showCameraSelector, setShowCameraSelector] = useState(false);

  // Define stopScanning first
  const stopScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  }, [isScanning]);

  // Define startScanning before useEffect
  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      setError('Selecteer eerst een camera');
      return;
    }

    // Save camera preference for next time (only if user made an explicit choice)
    // This prevents saving invalid camera IDs
    if (cameras.some(c => c.id === selectedCamera)) {
      localStorage.setItem(CAMERA_PREFERENCE_KEY, selectedCamera);
    }

    // First set isScanning to true so the div is rendered
    setIsScanning(true);
    setShowCameraSelector(false);
    setError(null);

    // Wait for the div to be in the DOM
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Stop any existing scanner first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          console.log('No active scanner to stop');
        }
      }

      // Check if the div exists
      if (!document.getElementById('barcode-reader')) {
        throw new Error('Scanner div not found in DOM');
      }

      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Prevent multiple scans
          if (hasScannedRef.current) {
            return;
          }
          hasScannedRef.current = true;

          // Success callback
          console.log('✅ Barcode scanned:', decodedText);

          // Stop scanning FIRST to prevent multiple scans
          await stopScanning();

          // Then call the callback
          onScan(decodedText);
        },
        (errorMessage) => {
          // Error callback (we can ignore most of these as they're just "no barcode found")
          // console.log('Scanning...', errorMessage);
        }
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      console.error('Full error details:', JSON.stringify(err, null, 2));
      setError(`Fout: ${err?.message || 'Kon scanner niet starten'}`);
      setIsScanning(false);
    }
  }, [selectedCamera, cameras, isScanning, onScan, stopScanning]);

  useEffect(() => {
    if (isOpen) {
      // Reset the scanned flag when modal opens
      hasScannedRef.current = false;

      // Get available cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            const cameraList = devices.map((d) => ({
              id: d.id,
              label: d.label || `Camera ${d.id}`,
            }));
            setCameras(cameraList);

            // Camera selection priority:
            // 1. Previously saved camera (if still available)
            // 2. Back camera (mobile preference)
            // 3. First available camera
            const savedCameraId = localStorage.getItem(CAMERA_PREFERENCE_KEY);
            const savedCameraExists = savedCameraId && cameraList.some(c => c.id === savedCameraId);
            const backCamera = devices.find((d) => d.label.toLowerCase().includes('back'));

            let cameraId: string;
            if (savedCameraExists) {
              cameraId = savedCameraId;
            } else if (backCamera) {
              cameraId = backCamera.id;
            } else {
              cameraId = devices[0].id;
            }

            setSelectedCamera(cameraId);

            // Auto-start behavior:
            // - If only 1 camera: start immediately, no selector
            // - If saved preference exists AND is valid: start immediately with saved camera
            // - Otherwise: show selector (first time or multiple cameras)
            if (devices.length === 1) {
              // Single camera - auto start without selector
              setShowCameraSelector(false);
              setTimeout(() => {
                if (cameraId) {
                  startScanning();
                }
              }, 200);
            } else if (savedCameraExists) {
              // Multiple cameras but valid saved preference - auto start
              setShowCameraSelector(false);
              setTimeout(() => {
                if (cameraId) {
                  startScanning();
                }
              }, 200);
            } else {
              // Multiple cameras and no valid saved preference - show selector
              setShowCameraSelector(true);
            }
          } else {
            setError('📷 Geen camera gevonden op dit apparaat.');
          }
        })
        .catch((err) => {
          // Only log to console for debugging, don't show to user by default
          console.log('Camera detection:', err.name, err.message);

          // User-friendly error messages
          if (err.name === 'NotFoundError' || err.message?.includes('not be found')) {
            setError('📷 Geen camera beschikbaar. Gebruik een mobiel apparaat of laptop met camera, of probeer de OpenFoodFacts zoekfunctie.');
          } else if (err.name === 'NotAllowedError') {
            setError('❌ Camera toegang geweigerd. Geef toestemming in je browser instellingen en probeer opnieuw.');
          } else if (err.name === 'NotReadableError') {
            setError('⚠️ Camera is al in gebruik door een andere app. Sluit deze eerst en probeer opnieuw.');
          } else {
            setError('📷 Camera niet beschikbaar op dit apparaat. Gebruik de OpenFoodFacts zoekfunctie of voeg handmatig een product toe.');
          }
        });
    } else {
      // Reset state when modal closes
      stopScanning();
      setShowCameraSelector(false);
      setCameras([]);
      setSelectedCamera('');
      setError(null);
      setIsScanning(false);
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, startScanning, stopScanning]);

  const handleChangeCamera = async () => {
    await stopScanning();
    setShowCameraSelector(true);
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  const handleResetPreference = () => {
    localStorage.removeItem(CAMERA_PREFERENCE_KEY);
    setShowCameraSelector(true);
    if (cameras.length > 0) {
      setSelectedCamera(cameras[0].id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 dark:bg-opacity-85 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Barcode Scanner</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {showCameraSelector && !isScanning && cameras.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecteer Camera
                  {cameras.length > 1 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({cameras.length} beschikbaar)
                    </span>
                  )}
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={startScanning}
                disabled={!selectedCamera}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📷 Start Scannen
              </button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div
                id="barcode-reader"
                className="w-full rounded-lg overflow-hidden border-4 border-blue-500 dark:border-blue-600"
              ></div>

              <div className="flex gap-2">
                <button
                  onClick={stopScanning}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  ⏹️ Stop
                </button>
                {cameras.length > 1 && (
                  <button
                    onClick={handleChangeCamera}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                  >
                    🔄 Camera
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Richt de camera op een barcode (EAN-13)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
