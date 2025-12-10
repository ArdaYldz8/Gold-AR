/**
 * CameraFeed Component
 * 
 * Displays the webcam video feed with mirrored selfie view.
 * Handles loading and error states for camera access.
 */

import React, { useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
import './CameraFeed.css';

interface CameraFeedProps {
    onVideoReady?: (video: HTMLVideoElement) => void;
    onError?: (error: string) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
    onVideoReady,
    onError,
}) => {
    const {
        videoRef,
        isLoading,
        error,
        hasPermission,
        startCamera,
    } = useCamera({
        width: 1280,
        height: 720,
        facingMode: 'user',
    });

    // Start camera on mount
    useEffect(() => {
        startCamera();
    }, [startCamera]);

    // Notify parent when video is ready
    useEffect(() => {
        if (hasPermission && videoRef.current && onVideoReady) {
            // Wait for video to be fully loaded
            const video = videoRef.current;
            const handleCanPlay = () => {
                onVideoReady(video);
            };

            video.addEventListener('canplay', handleCanPlay);

            // If video is already ready
            if (video.readyState >= 3) {
                onVideoReady(video);
            }

            return () => {
                video.removeEventListener('canplay', handleCanPlay);
            };
        }
    }, [hasPermission, videoRef, onVideoReady]);

    // Notify parent of errors
    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    return (
        <div className="camera-feed">
            {/* Loading State */}
            {isLoading && (
                <div className="camera-loading">
                    <div className="loading-spinner"></div>
                    <p>Accessing camera...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="camera-error">
                    <div className="error-icon">📷</div>
                    <h3>Camera Access Required</h3>
                    <p>{error}</p>
                    <button className="retry-btn" onClick={startCamera}>
                        Try Again
                    </button>
                </div>
            )}

            {/* Video Element */}
            <video
                ref={videoRef}
                className={`camera-video ${hasPermission ? 'visible' : ''}`}
                playsInline
                muted
                autoPlay
            />
        </div>
    );
};
