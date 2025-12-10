/**
 * useFaceMesh Hook
 * 
 * Integrates MediaPipe Face Mesh for face landmark detection
 * Used for positioning necklace (chin/jaw) and earring overlays (ears)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import type { Results as FaceMeshResults, NormalizedLandmarkList } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

/**
 * Face Mesh landmark indices for jewelry positioning
 * Reference: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 * 
 * Face has 468 landmarks. Key indices for jewelry:
 * 
 * Chin/Jaw (for necklace):
 * - 152: Chin center (bottom of face)
 * - 234: Left jaw (near ear)
 * - 454: Right jaw (near ear)
 * - 172: Under chin left
 * - 397: Under chin right
 * 
 * Ears (for earrings):
 * - 234: Left tragion (ear area contact point)
 * - 454: Right tragion (ear area contact point)
 * - 127: Left ear top
 * - 356: Right ear top
 * - 93: Left earlobe area
 * - 323: Right earlobe area
 */
export const FACE_LANDMARKS = {
    // Chin/Jaw landmarks for necklace
    CHIN_CENTER: 152,
    LEFT_JAW: 234,
    RIGHT_JAW: 454,
    UNDER_CHIN_LEFT: 172,
    UNDER_CHIN_RIGHT: 397,

    // Ear landmarks for earrings
    LEFT_EAR_TRAGION: 234,
    RIGHT_EAR_TRAGION: 454,
    LEFT_EARLOBE: 132,      // Approximate earlobe position
    RIGHT_EARLOBE: 361,     // Approximate earlobe position
    LEFT_EAR_TOP: 127,
    RIGHT_EAR_TOP: 356,

    // Additional face reference points
    NOSE_TIP: 1,
    FOREHEAD: 10,
    LEFT_EYE: 33,
    RIGHT_EYE: 263,
} as const;

export interface FaceLandmarks {
    landmarks: NormalizedLandmarkList;
}

export interface UseFaceMeshResult {
    isLoading: boolean;
    error: string | null;
    faces: FaceLandmarks[];
    isDetecting: boolean;
    startTracking: (videoElement: HTMLVideoElement) => void;
    stopTracking: () => void;
}

export function useFaceMesh(): UseFaceMeshResult {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [faces, setFaces] = useState<FaceLandmarks[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);

    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    /**
     * Initialize MediaPipe Face Mesh
     */
    useEffect(() => {
        const initFaceMesh = async () => {
            try {
                setIsLoading(true);

                // Create MediaPipe Face Mesh instance
                const faceMeshInstance = new FaceMesh({
                    locateFile: (file) => {
                        return `/mediapipe/face_mesh/${file}`;
                    },
                });

                // Configure face mesh parameters
                faceMeshInstance.setOptions({
                    maxNumFaces: 1,                    // Single face for try-on
                    refineLandmarks: true,             // More accurate landmarks around eyes, lips
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                // Set up results callback
                faceMeshInstance.onResults((results: FaceMeshResults) => {
                    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                        const detectedFaces: FaceLandmarks[] = results.multiFaceLandmarks.map(
                            (landmarks) => ({ landmarks })
                        );
                        setFaces(detectedFaces);
                        setIsDetecting(true);
                    } else {
                        setFaces([]);
                        setIsDetecting(false);
                    }
                });

                faceMeshRef.current = faceMeshInstance;
                setIsLoading(false);
            } catch (err) {
                console.error('Failed to initialize MediaPipe Face Mesh:', err);
                setError('Failed to load face tracking model');
                setIsLoading(false);
            }
        };

        initFaceMesh();

        // Cleanup on unmount
        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            faceMeshRef.current = null;
        };
    }, []);

    /**
     * Start face tracking on a video element
     */
    const startTracking = useCallback((videoElement: HTMLVideoElement) => {
        if (!faceMeshRef.current) {
            setError('Face mesh not initialized');
            return;
        }

        // Stop any existing camera
        if (cameraRef.current) {
            cameraRef.current.stop();
        }

        // Create camera utility for frame-by-frame processing
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                if (faceMeshRef.current) {
                    await faceMeshRef.current.send({ image: videoElement });
                }
            },
            width: videoElement.videoWidth || 1280,
            height: videoElement.videoHeight || 720,
        });

        camera.start();
        cameraRef.current = camera;
    }, []);

    /**
     * Stop face tracking
     */
    const stopTracking = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        setFaces([]);
        setIsDetecting(false);
    }, []);

    return {
        isLoading,
        error,
        faces,
        isDetecting,
        startTracking,
        stopTracking,
    };
}

/**
 * Get chin/jaw landmarks for necklace positioning
 * Returns points for computing necklace transform
 */
export function getChinLandmarks(landmarks: NormalizedLandmarkList) {
    return {
        center: landmarks[FACE_LANDMARKS.CHIN_CENTER],
        leftJaw: landmarks[FACE_LANDMARKS.LEFT_JAW],
        rightJaw: landmarks[FACE_LANDMARKS.RIGHT_JAW],
        underChinLeft: landmarks[FACE_LANDMARKS.UNDER_CHIN_LEFT],
        underChinRight: landmarks[FACE_LANDMARKS.UNDER_CHIN_RIGHT],
    };
}

/**
 * Get ear landmarks for earring positioning
 * Returns left and right ear points
 */
export function getEarLandmarks(landmarks: NormalizedLandmarkList) {
    return {
        leftEar: landmarks[FACE_LANDMARKS.LEFT_EARLOBE],
        rightEar: landmarks[FACE_LANDMARKS.RIGHT_EARLOBE],
        leftTragion: landmarks[FACE_LANDMARKS.LEFT_EAR_TRAGION],
        rightTragion: landmarks[FACE_LANDMARKS.RIGHT_EAR_TRAGION],
    };
}

/**
 * Calculate face width for scaling jewelry
 */
export function getFaceWidth(landmarks: NormalizedLandmarkList): number {
    const leftJaw = landmarks[FACE_LANDMARKS.LEFT_JAW];
    const rightJaw = landmarks[FACE_LANDMARKS.RIGHT_JAW];
    const dx = rightJaw.x - leftJaw.x;
    const dy = rightJaw.y - leftJaw.y;
    return Math.sqrt(dx * dx + dy * dy);
}
