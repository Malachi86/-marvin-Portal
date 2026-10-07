"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onCancel: () => void;
}

export default function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "barcode-scanner-reader";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only once on mount to initialize and start the scanner.
    
    // Ensure this runs only on the client
    if (typeof window === "undefined") {
      return;
    }
    
    // Use a timeout to ensure the DOM is ready, especially with dialog animations
    const timer = setTimeout(() => {
      // Prevent initialization if component is already unmounted
      if (!document.getElementById(readerId)) {
        return;
      }
      
      const html5QrCode = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
        ],
      });
      scannerRef.current = html5QrCode;

      const startCamera = async () => {
        try {
            // Simplified camera config for broader mobile compatibility.
            const cameraConfig = {
              facingMode: "environment"
            };

            await html5QrCode.start(
              cameraConfig,
              {
                fps: 10,
                qrbox: (viewfinderWidth, viewfinderHeight) => ({
                  width: viewfinderWidth * 0.7,
                  height: viewfinderWidth * 0.7,
                }),
              },
              (decodedText) => {
                // onScanSuccess
                if (scannerRef.current?.isScanning) {
                    scannerRef.current.stop();
                }
                onScan(decodedText);
                toast.success("Code Captured!");
              },
              () => { /* onScanFailure, ignore */ }
            );
            toast.info("Camera Active", { description: "Align code in the frame" });
        } catch (err: any) {
          console.error("Camera start error:", err);
          setError("Could not start camera. Please check browser permissions and ensure no other app is using the camera.");
        }
      };

      startCamera();
    }, 300); // 300ms delay to allow dialog to animate and render

    // Cleanup function to ensure the camera is stopped when the component unmounts.
    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative">
        <div id={readerId} className="w-full rounded-lg overflow-hidden border bg-black shadow-inner aspect-square">
          {error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
               <Alert variant="destructive">
                  <CameraOff className="h-4 w-4" />
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
        <Button
          onClick={onCancel}
          size="icon"
          className="absolute -top-4 -right-4 bg-primary text-white rounded-full shadow-lg border-4 border-white h-12 w-12 z-10"
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="text-center mt-4">
          <p className="font-bold">Scan Code</p>
          <p className="text-sm text-gray-500">Position the QR code or barcode inside the frame</p>
        </div>
      </div>
    </div>
  );
}
