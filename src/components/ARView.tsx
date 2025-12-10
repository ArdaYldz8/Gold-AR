/**
 * ARView Component
 * 
 * Main AR view that overlays jewelry on the camera feed.
 * Combines camera, tracking hooks, and overlay rendering.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CameraFeed } from './CameraFeed';
import { useHandTracking, getIndexFingerLandmarks } from '../hooks/useHandTracking';
import { useFaceMesh, getChinLandmarks, getEarLandmarks, getFaceWidth } from '../hooks/useFaceMesh';
import type { Product } from '../data/products';
import { computeTransform, normalizedToPixelCoords, radToDeg } from '../utils/geometry';
import './ARView.css';

interface ARViewProps {
    product: Product;
    onBack: () => void;
}

interface OverlayTransform {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    visible: boolean;
}

export const ARView: React.FC<ARViewProps> = ({ product, onBack }) => {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
    const [ringTransform, setRingTransform] = useState<OverlayTransform>({ x: 0, y: 0, scale: 1, rotation: 0, visible: false });
    const [necklaceTransform, setNecklaceTransform] = useState<OverlayTransform>({ x: 0, y: 0, scale: 1, rotation: 0, visible: false });
    const [leftEarringTransform, setLeftEarringTransform] = useState<OverlayTransform>({ x: 0, y: 0, scale: 1, rotation: 0, visible: false });
    const [rightEarringTransform, setRightEarringTransform] = useState<OverlayTransform>({ x: 0, y: 0, scale: 1, rotation: 0, visible: false });
    const [cameraError, setCameraError] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize tracking hooks
    const handTracking = useHandTracking();
    const faceMesh = useFaceMesh();

    // Determine which tracking to use based on product type
    const needsHandTracking = product.type === 'ring';
    const needsFaceTracking = product.type === 'necklace' || product.type === 'earring';

    /**
     * Handle video ready - start appropriate tracking
     */
    const handleVideoReady = useCallback((video: HTMLVideoElement) => {
        setVideoElement(video);
        setVideoDimensions({
            width: video.videoWidth || video.clientWidth,
            height: video.videoHeight || video.clientHeight,
        });

        // Start tracking based on product type
        if (needsHandTracking) {
            handTracking.startTracking(video);
        }
        if (needsFaceTracking) {
            faceMesh.startTracking(video);
        }
    }, [needsHandTracking, needsFaceTracking, handTracking, faceMesh]);

    /**
     * Update overlay transforms based on tracking data
     */
    useEffect(() => {
        if (!videoElement) return;

        const containerWidth = containerRef.current?.clientWidth || videoDimensions.width;
        const containerHeight = containerRef.current?.clientHeight || videoDimensions.height;

        // Ring positioning from hand tracking
        if (product.type === 'ring' && handTracking.hands.length > 0) {
            const hand = handTracking.hands[0];
            const fingerLandmarks = getIndexFingerLandmarks(hand.landmarks);

            // Use base and PIP joint for ring positioning
            const p1 = { x: fingerLandmarks.base.x, y: fingerLandmarks.base.y };
            const p2 = { x: fingerLandmarks.pip.x, y: fingerLandmarks.pip.y };

            const transform = computeTransform(p1, p2);

            // Convert to pixel coordinates (mirror X for selfie view)
            const { px, py } = normalizedToPixelCoords(
                1 - transform.x, // Mirror X
                transform.y,
                containerWidth,
                containerHeight
            );

            setRingTransform({
                x: px + product.offsetX,
                y: py + product.offsetY,
                scale: transform.scale * containerWidth * product.baseScale * 0.15,
                rotation: -radToDeg(transform.rotationRad), // Negate for mirrored view
                visible: true,
            });
        } else if (product.type === 'ring') {
            setRingTransform(prev => ({ ...prev, visible: false }));
        }

        // Necklace positioning from face mesh
        if (product.type === 'necklace' && faceMesh.faces.length > 0) {
            const face = faceMesh.faces[0];
            const chinLandmarks = getChinLandmarks(face.landmarks);
            const faceWidth = getFaceWidth(face.landmarks);

            // Compute transform from left/right jaw points
            const transform = computeTransform(
                { x: chinLandmarks.leftJaw.x, y: chinLandmarks.leftJaw.y },
                { x: chinLandmarks.rightJaw.x, y: chinLandmarks.rightJaw.y }
            );

            // Position below chin center
            const { px, py } = normalizedToPixelCoords(
                1 - chinLandmarks.center.x, // Mirror X
                chinLandmarks.center.y,
                containerWidth,
                containerHeight
            );

            setNecklaceTransform({
                x: px + product.offsetX,
                y: py + product.offsetY,
                scale: faceWidth * containerWidth * product.baseScale * 0.8,
                rotation: -radToDeg(transform.rotationRad),
                visible: true,
            });
        } else if (product.type === 'necklace') {
            setNecklaceTransform(prev => ({ ...prev, visible: false }));
        }

        // Earring positioning from face mesh
        if (product.type === 'earring' && faceMesh.faces.length > 0) {
            const face = faceMesh.faces[0];
            const earLandmarks = getEarLandmarks(face.landmarks);
            const faceWidth = getFaceWidth(face.landmarks);
            const earringScale = faceWidth * containerWidth * product.baseScale * 0.3;

            // Left earring (appears on right side in mirrored view)
            const leftEar = normalizedToPixelCoords(
                1 - earLandmarks.leftEar.x,
                earLandmarks.leftEar.y,
                containerWidth,
                containerHeight
            );
            setLeftEarringTransform({
                x: leftEar.px + product.offsetX,
                y: leftEar.py + product.offsetY,
                scale: earringScale,
                rotation: 0,
                visible: true,
            });

            // Right earring (appears on left side in mirrored view)
            const rightEar = normalizedToPixelCoords(
                1 - earLandmarks.rightEar.x,
                earLandmarks.rightEar.y,
                containerWidth,
                containerHeight
            );
            setRightEarringTransform({
                x: rightEar.px - product.offsetX,
                y: rightEar.py + product.offsetY,
                scale: earringScale,
                rotation: 0,
                visible: true,
            });
        } else if (product.type === 'earring') {
            setLeftEarringTransform(prev => ({ ...prev, visible: false }));
            setRightEarringTransform(prev => ({ ...prev, visible: false }));
        }
    }, [
        product,
        videoElement,
        videoDimensions,
        handTracking.hands,
        faceMesh.faces,
    ]);

    // Cleanup tracking on unmount
    useEffect(() => {
        return () => {
            handTracking.stopTracking();
            faceMesh.stopTracking();
        };
    }, []);

    // Loading state
    const isLoading =
        (needsHandTracking && handTracking.isLoading) ||
        (needsFaceTracking && faceMesh.isLoading);

    // Detection status
    const isDetecting =
        (needsHandTracking && handTracking.isDetecting) ||
        (needsFaceTracking && faceMesh.isDetecting);

    // Get detection hint message
    const getDetectionHint = () => {
        if (cameraError) return null;
        if (isLoading) return 'Loading AR model...';

        if (product.type === 'ring' && !handTracking.isDetecting) {
            return 'Show your hand to try on the ring';
        }
        if ((product.type === 'necklace' || product.type === 'earring') && !faceMesh.isDetecting) {
            return 'Position your face in the camera';
        }
        return null;
    };

    const detectionHint = getDetectionHint();

    return (
        <div className="ar-view" ref={containerRef}>
            {/* Back Button */}
            <button className="back-btn" onClick={onBack}>
                ← Back
            </button>

            {/* Product Info */}
            <div className="product-badge">
                <span className="product-icon">
                    {product.type === 'ring' && '💍'}
                    {product.type === 'necklace' && '📿'}
                    {product.type === 'earring' && '✨'}
                </span>
                {product.name}
            </div>

            {/* Camera Feed */}
            <CameraFeed
                onVideoReady={handleVideoReady}
                onError={setCameraError}
            />

            {/* Detection Hint */}
            {detectionHint && (
                <div className="detection-hint">
                    <div className="hint-content">
                        {isLoading && <div className="hint-spinner"></div>}
                        {detectionHint}
                    </div>
                </div>
            )}

            {/* Ring Overlay */}
            {product.type === 'ring' && ringTransform.visible && (
                <div
                    className="jewelry-overlay ring-overlay"
                    style={{
                        left: `${ringTransform.x}px`,
                        top: `${ringTransform.y}px`,
                        width: `${ringTransform.scale}px`,
                        height: `${ringTransform.scale}px`,
                        transform: `translate(-50%, -50%) rotate(${ringTransform.rotation}deg)`,
                    }}
                >
                    <div className="overlay-placeholder ring-placeholder">💍</div>
                </div>
            )}

            {/* Necklace Overlay */}
            {product.type === 'necklace' && necklaceTransform.visible && (
                <div
                    className="jewelry-overlay necklace-overlay"
                    style={{
                        left: `${necklaceTransform.x}px`,
                        top: `${necklaceTransform.y}px`,
                        width: `${necklaceTransform.scale}px`,
                        height: `${necklaceTransform.scale * 0.6}px`,
                        transform: `translate(-50%, 0) rotate(${necklaceTransform.rotation}deg)`,
                    }}
                >
                    <div className="overlay-placeholder necklace-placeholder">📿</div>
                </div>
            )}

            {/* Earring Overlays */}
            {product.type === 'earring' && leftEarringTransform.visible && (
                <>
                    <div
                        className="jewelry-overlay earring-overlay"
                        style={{
                            left: `${leftEarringTransform.x}px`,
                            top: `${leftEarringTransform.y}px`,
                            width: `${leftEarringTransform.scale}px`,
                            height: `${leftEarringTransform.scale * 1.5}px`,
                            transform: `translate(-50%, -30%)`,
                        }}
                    >
                        <div className="overlay-placeholder earring-placeholder">✨</div>
                    </div>
                    <div
                        className="jewelry-overlay earring-overlay"
                        style={{
                            left: `${rightEarringTransform.x}px`,
                            top: `${rightEarringTransform.y}px`,
                            width: `${rightEarringTransform.scale}px`,
                            height: `${rightEarringTransform.scale * 1.5}px`,
                            transform: `translate(-50%, -30%)`,
                        }}
                    >
                        <div className="overlay-placeholder earring-placeholder">✨</div>
                    </div>
                </>
            )}

            {/* Status Indicator */}
            <div className={`status-indicator ${isDetecting ? 'detecting' : 'searching'}`}>
                <div className="status-dot"></div>
                {isDetecting ? 'Tracking Active' : 'Searching...'}
            </div>
        </div>
    );
};
