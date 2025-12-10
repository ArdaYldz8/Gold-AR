# Web AR Jewelry Try-On

A browser-based Web AR virtual try-on system for gold jewelry, built with React, TypeScript, Vite, and MediaPipe.

![Demo](https://via.placeholder.com/800x400?text=Web+AR+Jewelry+Try-On+Demo)

## Features

- **Virtual Try-On**: Try on rings, necklaces, and earrings in real-time using your webcam.
- **Hand Tracking**: Uses MediaPipe Hands to detect finger positions for accurate ring placement.
- **Face Mesh**: Uses MediaPipe Face Mesh to detect chin and ear positions for necklaces and earrings.
- **Responsive UI**: Modern, dark-themed interface for selecting products.
- **In-Memory Catalog**: Extensible product list with positioning configurations.

## Tech Stack

- **Framework**: React + TypeScript + Vite
- **AR/CV**: MediaPipe Hands, MediaPipe Face Mesh
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- A webcam

### Installation

1. Clone the repository (or extract the project files).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.
   - **Note**: Camera access requires a secure context (HTTPS) or `localhost`.

## Usage

1. **Select a Product**: Browse the catalog and click on a ring, necklace, or earring.
2. **Start AR**: Click the "Start AR Try-On" button.
3. **Grant Permission**: Allow camera access when prompted.
4. **Try It On**:
   - For **Rings**: Show your hand to the camera. The ring will appear on your index finger.
   - For **Necklaces/Earrings**: Position your face in the frame. The jewelry will appear on your neck/ears.

## Adding New Products

To add new jewelry items:

1. Add your PNG image to `src/assets/`.
2. Update `src/data/products.ts` with the new item:

   ```typescript
   {
     id: 'new-ring',
     name: 'New Gold Ring',
     type: 'ring',
     image: '/assets/new-ring.png',
     baseScale: 2.5, // Adjust size
     offsetX: 0,     // Adjust horizontal position
     offsetY: 0,     // Adjust vertical position
   }
   ```

## Development

- **Unit Tests**: Run geometry utility tests.
  ```bash
  npm test
  ```

## License

MIT
