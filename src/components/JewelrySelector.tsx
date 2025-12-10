/**
 * JewelrySelector Component
 * 
 * Product selection UI that displays jewelry items as cards.
 * Users can filter by type (ring, necklace, earring) and select items.
 */

import React, { useState } from 'react';
import { products } from '../data/products';
import type { Product, JewelryType } from '../data/products';
import './JewelrySelector.css';

interface JewelrySelectorProps {
    onSelectProduct: (product: Product) => void;
    selectedProduct: Product | null;
    onStartAR: () => void;
}

const JEWELRY_TYPES: { type: JewelryType; label: string; icon: string }[] = [
    { type: 'ring', label: 'Rings', icon: '💍' },
    { type: 'necklace', label: 'Necklaces', icon: '📿' },
    { type: 'earring', label: 'Earrings', icon: '✨' },
];

export const JewelrySelector: React.FC<JewelrySelectorProps> = ({
    onSelectProduct,
    selectedProduct,
    onStartAR,
}) => {
    // Active filter for jewelry type
    const [activeType, setActiveType] = useState<JewelryType | 'all'>('all');

    // Filter products based on selected type
    const filteredProducts = activeType === 'all'
        ? products
        : products.filter(p => p.type === activeType);

    return (
        <div className="jewelry-selector">
            {/* Header */}
            <div className="selector-header">
                <h1 className="selector-title">
                    <span className="gold-text">Virtual</span> Try-On
                </h1>
                <p className="selector-subtitle">
                    Select a piece of jewelry to try on virtually
                </p>
            </div>

            {/* Type Filter Tabs */}
            <div className="type-filters">
                <button
                    className={`filter-btn ${activeType === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveType('all')}
                >
                    All
                </button>
                {JEWELRY_TYPES.map(({ type, label, icon }) => (
                    <button
                        key={type}
                        className={`filter-btn ${activeType === type ? 'active' : ''}`}
                        onClick={() => setActiveType(type)}
                    >
                        <span className="filter-icon">{icon}</span>
                        {label}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid">
                {filteredProducts.map(product => (
                    <div
                        key={product.id}
                        className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                        onClick={() => onSelectProduct(product)}
                    >
                        {/* Product Image Placeholder */}
                        <div className="product-image">
                            <div className="image-placeholder">
                                {product.type === 'ring' && '💍'}
                                {product.type === 'necklace' && '📿'}
                                {product.type === 'earring' && '✨'}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="product-info">
                            <h3 className="product-name">{product.name}</h3>
                            <span className="product-type">{product.type}</span>
                            {product.price && (
                                <span className="product-price">{product.price}</span>
                            )}
                        </div>

                        {/* Selection Indicator */}
                        {selectedProduct?.id === product.id && (
                            <div className="selected-badge">✓</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Start AR Button */}
            <div className="ar-action">
                <button
                    className="start-ar-btn"
                    onClick={onStartAR}
                    disabled={!selectedProduct}
                >
                    {selectedProduct ? (
                        <>
                            <span className="ar-icon">📸</span>
                            Start AR Try-On
                        </>
                    ) : (
                        'Select a product first'
                    )}
                </button>

                {selectedProduct && (
                    <p className="selected-info">
                        Selected: <strong>{selectedProduct.name}</strong>
                    </p>
                )}
            </div>
        </div>
    );
};
