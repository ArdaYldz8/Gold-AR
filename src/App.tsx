import { useState } from 'react';
import { JewelrySelector } from './components/JewelrySelector';
import { ARView } from './components/ARView';
import { DebugConsole } from './components/DebugConsole';
import type { Product } from './data/products';
import './App.css';

function App() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isARMode, setIsARMode] = useState(false);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleStartAR = () => {
    if (selectedProduct) {
      setIsARMode(true);
    }
  };

  const handleBack = () => {
    setIsARMode(false);
  };

  return (
    <div className="app">
      {isARMode && selectedProduct ? (
        <ARView
          product={selectedProduct}
          onBack={handleBack}
        />
      ) : (
        <JewelrySelector
          onSelectProduct={handleSelectProduct}
          selectedProduct={selectedProduct}
          onStartAR={handleStartAR}
        />
      )}
      <DebugConsole />
    </div>
  );
}

export default App;
