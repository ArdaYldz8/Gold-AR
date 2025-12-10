/**
 * Product Catalog for Jewelry Try-On
 * 
 * In-memory product database with jewelry items.
 * Each product has positioning hints (baseScale, offsetX, offsetY) for fine-tuning.
 */

export type JewelryType = 'ring' | 'necklace' | 'earring';

export interface Product {
    id: string;
    name: string;
    type: JewelryType;
    image: string;          // Path to PNG overlay image
    baseScale: number;      // Base scale multiplier for the overlay
    offsetX: number;        // Horizontal offset adjustment
    offsetY: number;        // Vertical offset adjustment
    price?: string;         // Display price (optional)
    description?: string;   // Product description (optional)
}

/**
 * Product catalog with sample jewelry items
 * Images use placeholder paths - replace with actual PNG assets
 */
export const products: Product[] = [
    // Rings
    {
        id: 'ring-1',
        name: 'Classic Gold Band',
        type: 'ring',
        image: '/assets/ring1.png',
        baseScale: 2.5,
        offsetX: 0,
        offsetY: 0,
        price: '₺4,500',
        description: 'Elegant 14K gold band with polished finish',
    },
    {
        id: 'ring-2',
        name: 'Diamond Solitaire',
        type: 'ring',
        image: '/assets/ring2.png',
        baseScale: 3.0,
        offsetX: 0,
        offsetY: -5,
        price: '₺12,000',
        description: 'Stunning solitaire with brilliant cut diamond',
    },
    {
        id: 'ring-3',
        name: 'Twisted Gold Ring',
        type: 'ring',
        image: '/assets/ring3.png',
        baseScale: 2.8,
        offsetX: 0,
        offsetY: 0,
        price: '₺5,200',
        description: 'Modern twisted design in 18K gold',
    },

    // Necklaces
    {
        id: 'necklace-1',
        name: 'Minimal Gold Chain',
        type: 'necklace',
        image: '/assets/necklace1.png',
        baseScale: 1.2,
        offsetX: 0,
        offsetY: 30,
        price: '₺8,500',
        description: 'Delicate chain perfect for everyday wear',
    },
    {
        id: 'necklace-2',
        name: 'Pearl Pendant',
        type: 'necklace',
        image: '/assets/necklace2.png',
        baseScale: 1.4,
        offsetX: 0,
        offsetY: 40,
        price: '₺15,000',
        description: 'Freshwater pearl on gold chain',
    },
    {
        id: 'necklace-3',
        name: 'Layered Gold Necklace',
        type: 'necklace',
        image: '/assets/necklace3.png',
        baseScale: 1.5,
        offsetX: 0,
        offsetY: 35,
        price: '₺11,000',
        description: 'Trendy layered design',
    },

    // Earrings
    {
        id: 'earring-1',
        name: 'Gold Studs',
        type: 'earring',
        image: '/assets/earring1.png',
        baseScale: 0.8,
        offsetX: 0,
        offsetY: 10,
        price: '₺2,800',
        description: 'Classic gold stud earrings',
    },
    {
        id: 'earring-2',
        name: 'Drop Earrings',
        type: 'earring',
        image: '/assets/earring2.png',
        baseScale: 1.2,
        offsetX: 0,
        offsetY: 15,
        price: '₺6,500',
        description: 'Elegant drop design with crystals',
    },
    {
        id: 'earring-3',
        name: 'Hoop Earrings',
        type: 'earring',
        image: '/assets/earring3.png',
        baseScale: 1.0,
        offsetX: 5,
        offsetY: 5,
        price: '₺4,200',
        description: 'Modern gold hoops',
    },
];

/**
 * Get products filtered by type
 */
export function getProductsByType(type: JewelryType): Product[] {
    return products.filter(p => p.type === type);
}

/**
 * Get a single product by ID
 */
export function getProductById(id: string): Product | undefined {
    return products.find(p => p.id === id);
}
