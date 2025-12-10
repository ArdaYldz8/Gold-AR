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

    /**
     * Start the camera stream
     * Requests permission and attaches stream to video element
     */
    const startCamera = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API is not supported in this browser');
            }

            // Request camera access with specified constraints
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: mergedOptions.width },
                    height: { ideal: mergedOptions.height },
                    facingMode: mergedOptions.facingMode,
                },
                audio: false, // We don't need audio for AR try-on
            });

            // Attach stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;

                // Wait for video metadata to load before playing
                await new Promise<void>((resolve, reject) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play()
                                .then(() => resolve())
                                .catch(reject);
                        };
                    }
                });
            }

            setStream(mediaStream);
            setHasPermission(true);
        } catch (err) {
            // Handle specific error types
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera access denied. Please allow camera permission to use AR try-on.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('No camera found. Please connect a camera and try again.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setError('Camera is in use by another application. Please close other apps using the camera.');
                } else if (err.name === 'OverconstrainedError') {
                    setError('Camera does not support the required resolution.');
                } else {
                    setError(err.message || 'Failed to access camera');
                }
            } else {
                setError('An unknown error occurred while accessing the camera');
            }
            setHasPermission(false);
        } finally {
            setIsLoading(false);
        }
    }, [mergedOptions.width, mergedOptions.height, mergedOptions.facingMode]);

    /**
     * Stop the camera stream
     * Releases all tracks and cleans up resources
     */
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

    // Cleanup on unmount
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
    };
}
