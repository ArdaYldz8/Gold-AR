/**
 * Geometry utilities for AR jewelry positioning
 * 
 * These pure functions handle the math for converting MediaPipe landmarks
 * into transform data (position, scale, rotation) for jewelry overlays.
 */

/**
 * Represents a 2D point with x and y coordinates
 * MediaPipe returns normalized coordinates in [0, 1] range
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Transform data for positioning jewelry overlays
 * - x, y: center position in pixels
 * - scale: size multiplier based on landmark distance
 * - rotationRad: rotation angle in radians
 */
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotationRad: number;
}

/**
 * Compute transform (center, scale, rotation) from two landmark points
 * 
 * This is the core function for positioning jewelry overlays:
 * - For rings: p1 = finger base, p2 = finger joint
 * - For necklaces: p1 = left jaw, p2 = right jaw
 * - For earrings: single point, so p1 = p2 = ear position
 * 
 * @param p1 - First landmark point (normalized coordinates)
 * @param p2 - Second landmark point (normalized coordinates)
 * @returns Transform object with center position, scale, and rotation
 */
export function computeTransform(p1: Point, p2: Point): Transform {
  // Calculate center as midpoint between the two points
  const x = (p1.x + p2.x) / 2;
  const y = (p1.y + p2.y) / 2;

  // Calculate scale as Euclidean distance between points
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const scale = Math.sqrt(dx * dx + dy * dy);

  // Calculate rotation angle using atan2 for proper quadrant handling
  // atan2(dy, dx) gives angle from positive x-axis
  const rotationRad = Math.atan2(dy, dx);

  return { x, y, scale, rotationRad };
}

/**
 * Convert normalized [0, 1] coordinates to pixel coordinates
 * 
 * MediaPipe returns landmarks in normalized coordinates where:
 * - (0, 0) is top-left corner
 * - (1, 1) is bottom-right corner
 * 
 * This function converts to actual pixel positions for overlay positioning.
 * 
 * @param x - Normalized x coordinate [0, 1]
 * @param y - Normalized y coordinate [0, 1]
 * @param width - Video/canvas width in pixels
 * @param height - Video/canvas height in pixels
 * @returns Pixel coordinates { px, py }
 */
export function normalizedToPixelCoords(
  x: number,
  y: number,
  width: number,
  height: number
): { px: number; py: number } {
  return {
    px: x * width,
    py: y * height,
  };
}

/**
 * Convert radians to degrees
 * Useful for CSS transform: rotate() which uses degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Clamp a value between min and max bounds
 * Useful for keeping overlays within visible bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
