import { describe, it, expect } from 'vitest';
import { computeTransform, normalizedToPixelCoords, radToDeg } from '../src/utils/geometry';

describe('Geometry Utilities', () => {
    describe('computeTransform', () => {
        it('calculates correct center and scale for horizontal points', () => {
            const p1 = { x: 0.2, y: 0.5 };
            const p2 = { x: 0.8, y: 0.5 };

            const result = computeTransform(p1, p2);

            expect(result.x).toBeCloseTo(0.5); // Midpoint x
            expect(result.y).toBeCloseTo(0.5); // Midpoint y
            expect(result.scale).toBeCloseTo(0.6); // Distance
            expect(result.rotationRad).toBeCloseTo(0); // Horizontal line
        });

        it('calculates correct rotation for vertical points', () => {
            const p1 = { x: 0.5, y: 0.2 };
            const p2 = { x: 0.5, y: 0.8 };

            const result = computeTransform(p1, p2);

            expect(result.rotationRad).toBeCloseTo(Math.PI / 2); // 90 degrees
        });

        it('calculates rotation for diagonal points', () => {
            const p1 = { x: 0, y: 0 };
            const p2 = { x: 1, y: 1 };

            const result = computeTransform(p1, p2);

            expect(result.rotationRad).toBeCloseTo(Math.PI / 4); // 45 degrees
        });
    });

    describe('normalizedToPixelCoords', () => {
        it('converts normalized coordinates to pixels', () => {
            const result = normalizedToPixelCoords(0.5, 0.5, 1920, 1080);

            expect(result.px).toBe(960);
            expect(result.py).toBe(540);
        });

        it('handles zero coordinates', () => {
            const result = normalizedToPixelCoords(0, 0, 100, 100);

            expect(result.px).toBe(0);
            expect(result.py).toBe(0);
        });

        it('handles max coordinates', () => {
            const result = normalizedToPixelCoords(1, 1, 100, 100);

            expect(result.px).toBe(100);
            expect(result.py).toBe(100);
        });
    });

    describe('radToDeg', () => {
        it('converts radians to degrees', () => {
            expect(radToDeg(0)).toBe(0);
            expect(radToDeg(Math.PI)).toBe(180);
            expect(radToDeg(Math.PI / 2)).toBe(90);
        });
    });
});
