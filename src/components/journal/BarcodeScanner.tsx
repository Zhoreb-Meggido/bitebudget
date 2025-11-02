/**
 * BarcodeScanner - Barcode scanning component using html5-qrcode
 */

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const readerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Get available cameras
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(
              devices.map((d) => ({
                id: d.id,
                label: d.label || `Camera ${d.id}`,
              }))
            );
            // Prefer back camera on mobile
            const backCamera = devices.find((d) => d.label.toLowerCase().includes('back'));
            setSelectedCamera(backCamera?.id || devices[0].id);
          } else {
            setError('Geen camera gevonden');
          }
        })
        .catch((err) => {
          console.error('Error getting cameras:', err);
          setError('Geen toegang tot camera');
        });
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('Selecteer eerst een camera');
      return;
    }

    // First set isScanning to true so the div is rendered
    setIsScanning(true);
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
        (decodedText) => {
          // Success callback
          console.log('✅ Barcode scanned:', decodedText);
          onScan(decodedText);
          stopScanning();
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
  };

  const stopScanning = async () => {
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
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="bg-white border-b p-4 flex justify-between items-center rounded-t-xl">
          <h3 className="text-xl font-bold">Barcode Scanner</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isScanning && cameras.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Selecteer Camera</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
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
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                📷 Start Scannen
              </button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div
                id="barcode-reader"
                className="w-full rounded-lg overflow-hidden border-4 border-blue-500"
              ></div>

              <button
                onClick={stopScanning}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                ⏹️ Stop Scannen
              </button>

              <p className="text-sm text-gray-600 text-center">
                Richt de camera op een barcode (EAN-13)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
