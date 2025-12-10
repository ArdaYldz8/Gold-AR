/**
 * useHandTracking Hook
 * 
 * Integrates MediaPipe Hands for hand/finger landmark detection
 * Used for positioning ring overlays on the index finger
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as mpHands from '@mediapipe/hands';
import type { Results as HandsResults, NormalizedLandmarkList } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

/**
 * Hand landmark indices for ring positioning
 * Reference: https://google.github.io/mediapipe/solutions/hands.html
 * 
 * Index finger landmarks:
 * - 5: INDEX_FINGER_MCP (metacarpophalangeal joint / knuckle)
 * - 6: INDEX_FINGER_PIP (proximal interphalangeal joint)
 * - 7: INDEX_FINGER_DIP (distal interphalangeal joint)
 * - 8: INDEX_FINGER_TIP
 */
export const HAND_LANDMARKS = {
    INDEX_FINGER_MCP: 5,  // Base of index finger (knuckle)
    INDEX_FINGER_PIP: 6,  // First joint
    INDEX_FINGER_DIP: 7,  // Second joint
    INDEX_FINGER_TIP: 8,  // Fingertip
    // Middle finger (alternative for ring)
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    // Ring finger
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
} as const;

export interface HandLandmarks {
    landmarks: NormalizedLandmarkList;
    handedness: 'Left' | 'Right';
}

export interface UseHandTrackingResult {
    isLoading: boolean;
    error: string | null;
    hands: HandLandmarks[];
    isDetecting: boolean;
    startTracking: (videoElement: HTMLVideoElement) => void;
    stopTracking: () => void;
}

export function useHandTracking(): UseHandTrackingResult {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hands, setHands] = useState<HandLandmarks[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);

    const handsRef = useRef<Hands | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    /**
     * Initialize MediaPipe Hands
     * Loads the model and sets up result handling
     */
    useEffect(() => {
        const initHands = async () => {
            try {
                setIsLoading(true);

                console.log('MediaPipe Hands Import:', mpHands);

                // Create MediaPipe Hands instance
                const HandsClass = mpHands.Hands || (mpHands as any).default?.Hands || (window as any).Hands;
                if (!HandsClass) {
                    throw new Error('Hands class not found in import');
                }

                const handsInstance = new HandsClass({
                    locateFile: (file) => {
                        const url = `/mediapipe/hands/${file}`;
                        console.log(`Loading MediaPipe file: ${url}`);
                        return url;
                    },
                });

                // Configure hand detection parameters
                handsInstance.setOptions({
                    maxNumHands: 2,           // Detect up to 2 hands
                    modelComplexity: 0,       // 0=lite (faster), 1=full
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                // Set up results callback
                handsInstance.onResults((results: HandsResults) => {
                    const count = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
                    if (Math.random() < 0.05) console.log(`Results received: ${count} hands detected`);

                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        const detectedHands: HandLandmarks[] = results.multiHandLandmarks.map(
                            (landmarks, index) => ({
                                landmarks,
                                handedness: (results.multiHandedness?.[index]?.label as 'Left' | 'Right') || 'Right',
                            })
                        );
                        setHands(detectedHands);
                        setIsDetecting(true);
                    } else {
                        setHands([]);
                        setIsDetecting(false);
                    }
                });

                handsRef.current = handsInstance;
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to initialize MediaPipe Hands:', err);
                if (err instanceof Error) {
                    console.error('Error details:', err.message, err.stack);
                }
                setError('Failed to load hand tracking model: ' + (err instanceof Error ? err.message : String(err)));
                setIsLoading(false);
            }
        };

        console.log('Initializing Hand Tracking...');
        initHands();

        // Cleanup on unmount
        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            handsRef.current = null;
        };
    }, []);

    /**
     * Start hand tracking on a video element
     * Uses MediaPipe Camera utility for frame processing
     */
    const startTracking = useCallback((videoElement: HTMLVideoElement) => {
        if (!handsRef.current) {
            setError('Hand tracking not initialized');
            return;
        }

        // Stop any existing camera
        if (cameraRef.current) {
            cameraRef.current.stop();
        }

        // Create camera utility for frame-by-frame processing
        let frameCount = 0;
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                if (handsRef.current) {
                    frameCount++;
                    if (frameCount % 60 === 0) {
                        console.log(`Processing frame ${frameCount}, video size: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                    }
                    try {
                        await handsRef.current.send({ image: videoElement });
                    } catch (e) {
                        console.error("Error sending frame to Hands:", e);
                    }
                }
            },
            width: videoElement.videoWidth || 1280,
            height: videoElement.videoHeight || 720,
        });

        camera.start();
        cameraRef.current = camera;
    }, []);

    /**
     * Stop hand tracking
     */
    const stopTracking = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        setHands([]);
        setIsDetecting(false);
    }, []);

    return {
        isLoading,
        error,
        hands,
        isDetecting,
        startTracking,
        stopTracking,
    };
}

/**
 * Get index finger landmarks for ring positioning
 * Returns the base and PIP joint for computing ring transform
 */
export function getIndexFingerLandmarks(landmarks: NormalizedLandmarkList) {
    return {
        base: landmarks[HAND_LANDMARKS.INDEX_FINGER_MCP],
        pip: landmarks[HAND_LANDMARKS.INDEX_FINGER_PIP],
        dip: landmarks[HAND_LANDMARKS.INDEX_FINGER_DIP],
        tip: landmarks[HAND_LANDMARKS.INDEX_FINGER_TIP],
    };
}

/**
 * Get ring finger landmarks (alternative finger for ring)
 */
export function getRingFingerLandmarks(landmarks: NormalizedLandmarkList) {
    return {
        base: landmarks[HAND_LANDMARKS.RING_FINGER_MCP],
        pip: landmarks[HAND_LANDMARKS.RING_FINGER_PIP],
    };
}
