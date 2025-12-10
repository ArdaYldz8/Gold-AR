/**
 * useHandTracking Hook (MediaPipe Vision Tasks API)
 * 
 * Uses the new @mediapipe/tasks-vision HandLandmarker for hand detection
 * This is the modern API with better mobile support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

/**
 * Hand landmark indices for ring positioning
 * Same as before - 21 landmarks per hand
 */
export const HAND_LANDMARKS = {
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
} as const;

export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
}

export interface HandLandmarks {
    landmarks: NormalizedLandmark[];
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

    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Initialize HandLandmarker
    useEffect(() => {
        const initHandLandmarker = async () => {
            try {
                setIsLoading(true);
                console.log('Initializing MediaPipe Vision Tasks HandLandmarker...');

                // Load WASM files from CDN
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );

                // Create HandLandmarker with local model file
                const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: '/models/hand_landmarker.task',
                        delegate: 'GPU' // Use GPU for better performance
                    },
                    runningMode: 'VIDEO',
                    numHands: 2,
                    minHandDetectionConfidence: 0.5,
                    minHandPresenceConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                handLandmarkerRef.current = handLandmarker;
                setIsLoading(false);
                console.log('HandLandmarker initialized successfully!');
            } catch (err) {
                console.error('Failed to initialize HandLandmarker:', err);
                setError('Failed to load hand tracking model: ' + (err instanceof Error ? err.message : String(err)));
                setIsLoading(false);
            }
        };

        initHandLandmarker();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
            }
        };
    }, []);

    // Process video frames
    const processFrame = useCallback(() => {
        const video = videoElementRef.current;
        const handLandmarker = handLandmarkerRef.current;

        if (!video || !handLandmarker || video.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
        }

        try {
            const results = handLandmarker.detectForVideo(video, performance.now());

            if (results.landmarks && results.landmarks.length > 0) {
                const detectedHands: HandLandmarks[] = results.landmarks.map(
                    (landmarks, index) => ({
                        landmarks: landmarks as NormalizedLandmark[],
                        handedness: (results.handednesses?.[index]?.[0]?.categoryName as 'Left' | 'Right') || 'Right',
                    })
                );
                setHands(detectedHands);
                setIsDetecting(true);
            } else {
                setHands([]);
                setIsDetecting(false);
            }
        } catch (e) {
            console.error('Error processing frame:', e);
        }

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, []);

    const startTracking = useCallback((videoElement: HTMLVideoElement) => {
        if (!handLandmarkerRef.current) {
            setError('Hand tracking not initialized');
            return;
        }

        videoElementRef.current = videoElement;

        // Stop any existing animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Start processing frames
        animationFrameRef.current = requestAnimationFrame(processFrame);
        console.log('Started hand tracking');
    }, [processFrame]);

    const stopTracking = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        videoElementRef.current = null;
        setHands([]);
        setIsDetecting(false);
        console.log('Stopped hand tracking');
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
 */
export function getIndexFingerLandmarks(landmarks: NormalizedLandmark[]) {
    return {
        base: landmarks[HAND_LANDMARKS.INDEX_FINGER_MCP],
        pip: landmarks[HAND_LANDMARKS.INDEX_FINGER_PIP],
        dip: landmarks[HAND_LANDMARKS.INDEX_FINGER_DIP],
        tip: landmarks[HAND_LANDMARKS.INDEX_FINGER_TIP],
    };
}

/**
 * Get ring finger landmarks
 */
export function getRingFingerLandmarks(landmarks: NormalizedLandmark[]) {
    return {
        base: landmarks[HAND_LANDMARKS.RING_FINGER_MCP],
        pip: landmarks[HAND_LANDMARKS.RING_FINGER_PIP],
    };
}
