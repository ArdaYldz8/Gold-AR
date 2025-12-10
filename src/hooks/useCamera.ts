/**
 * useCamera Hook
 * 
 * Handles webcam access via navigator.mediaDevices.getUserMedia
 * Provides video stream, loading state, and error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCameraResult {
    videoRef: React.RefObject<HTMLVideoElement>;
    stream: MediaStream | null;
    isLoading: boolean;
    error: string | null;
    hasPermission: boolean;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    facingMode: 'user' | 'environment' | undefined;
    switchCamera: () => void;
}

export interface CameraOptions {
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
}

const DEFAULT_OPTIONS: CameraOptions = {
    width: 1280,
    height: 720,
    facingMode: 'user', // Front-facing camera for selfie view
};

export function useCamera(options: CameraOptions = {}): UseCameraResult {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [facingMode, setFacingMode] = useState<CameraOptions['facingMode']>(mergedOptions.facingMode);

    /**
     * Start the camera stream
     */
    const startCamera = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Stop existing stream if any
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API is not supported in this browser');
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: mergedOptions.width },
                    height: { ideal: mergedOptions.height },
                    facingMode: facingMode,
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await new Promise<void>((resolve, reject) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play().then(() => resolve()).catch(reject);
                        };
                    }
                });
            }

            setStream(mediaStream);
            setHasPermission(true);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to access camera');
            } else {
                setError('An unknown error occurred');
            }
            setHasPermission(false);
        } finally {
            setIsLoading(false);
        }
    }, [mergedOptions.width, mergedOptions.height, facingMode]);

    /**
     * Switch between front and back camera
     */
    const switchCamera = useCallback(() => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }, []);

    // Update dependencies for startCamera to include facingMode changes
    useEffect(() => {
        // Only restart if we already have permission or attempted to start
        if (hasPermission || error) {
            startCamera();
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setHasPermission(false);
    }, [stream]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return {
        videoRef,
        stream,
        isLoading,
        error,
        hasPermission,
        startCamera,
        stopCamera,
        facingMode,
        switchCamera
    };
}
