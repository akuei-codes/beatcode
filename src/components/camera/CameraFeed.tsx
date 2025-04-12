
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CameraFeedProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onCameraStatusChange?: (isActive: boolean) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  size = 'md', 
  className,
  onCameraStatusChange 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Size classes mapping
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48'
  };

  const startCamera = async () => {
    if (streamRef.current) return;
    
    setIsLoading(true);
    setCameraRequested(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        onCameraStatusChange?.(true);
        toast.success("Camera activated successfully");
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error("Failed to access camera. Please ensure you've granted camera permissions.");
      setCameraActive(false);
      onCameraStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setCameraActive(false);
      onCameraStatusChange?.(false);
      toast.info("Camera deactivated");
    }
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {cameraRequested && (
        <div className={`relative bg-icon-gray rounded-lg overflow-hidden mb-2 ${sizeClasses[size]}`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!cameraActive && 'hidden'}`}
          />
          {!cameraActive && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-icon-black/80 text-icon-light-gray">
              <CameraOff className="h-8 w-8" />
            </div>
          )}
        </div>
      )}
      
      <Button 
        variant={cameraActive ? "destructive" : "secondary"} 
        size="sm"
        onClick={toggleCamera}
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Accessing...</span>
          </>
        ) : cameraActive ? (
          <>
            <CameraOff className="h-4 w-4" />
            <span>Turn Off Camera</span>
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            <span>Turn On Camera</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default CameraFeed;
