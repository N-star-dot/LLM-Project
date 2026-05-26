import sqlite3

def setup_catalog():
    conn = sqlite3.connect('wayfair_catalog.db')
    cursor = conn.cursor()

    cursor.execute('DROP TABLE IF EXISTS products')

    cursor.execute('''
        CREATE TABLE products (
            id TEXT PRIMARY KEY,
            name TEXT,
            category TEXT,
            price REAL,
            image_url TEXT,
            aesthetic_description TEXT
        )
    ''')

    # Base image URLs using placehold.co with colors indicating the vibe
    mcm_img = "https://placehold.co/400x400/D2B48C/ffffff?text=MCM+Furniture"
    ind_img = "https://placehold.co/400x400/2F4F4F/ffffff?text=Industrial+Furniture"
    cst_img = "https://placehold.co/400x400/F0E68C/000000?text=Coastal+Furniture"

    products = [
        # Mid-Century Modern (10 items)
        ('MCM-001', 'Walnut Wood Media Console', 'Living Room', 450.00, mcm_img, 'mid-century modern, walnut, tapered legs, geometric, retro, warm wood'),
        ('MCM-002', 'Mustard Velvet Accent Chair', 'Seating', 299.99, mcm_img, 'velvet, mid-century, retro, mustard yellow, vintage, tufted'),
        ('MCM-003', 'Teak Round Dining Table', 'Dining', 550.00, mcm_img, 'teak, round, modern, minimal, mid-century modern, tapered legs'),
        ('MCM-004', 'Atomic Starburst Wall Clock', 'Decor', 89.00, mcm_img, 'retro, starburst, atomic, mid-century modern, brass, decorative'),
        ('MCM-005', 'Emerald Green Velvet Sofa', 'Living Room', 899.00, mcm_img, 'sofa, mid-century, velvet, emerald green, walnut legs, tufted'),
        ('MCM-006', 'Acorn Wood Bed Frame', 'Bedroom', 650.00, mcm_img, 'bed, mid-century modern, acorn finish, wood, retro, platform'),
        ('MCM-007', 'Geometric Pattern Area Rug', 'Rugs', 150.00, mcm_img, 'rug, mid-century, geometric, retro, colorful, abstract'),
        ('MCM-008', 'Globe Pendant Light', 'Lighting', 120.00, mcm_img, 'lighting, brass, globe, mid-century modern, retro, minimalist'),
        ('MCM-009', 'Nesting Coffee Tables', 'Living Room', 210.00, mcm_img, 'coffee table, walnut, nesting, mid-century modern, tapered legs'),
        ('MCM-010', 'Retro Leather Lounge Chair', 'Seating', 340.00, mcm_img, 'leather, lounge chair, mid-century, wood frame, retro, warm'),

        # Industrial/Dark (10 items)
        ('IND-001', 'Matte Black Pipe Bookshelf', 'Storage', 199.00, ind_img, 'industrial, matte black, exposed pipes, raw steel, rustic wood, urban'),
        ('IND-002', 'Distressed Leather Sofa', 'Living Room', 1200.00, ind_img, 'leather, dark, distressed, industrial, urban loft, heavy'),
        ('IND-003', 'Concrete Top Coffee Table', 'Living Room', 320.00, ind_img, 'concrete, matte black legs, industrial, heavy, urban, modern'),
        ('IND-004', 'Edison Bulb Chandelier', 'Lighting', 180.00, ind_img, 'lighting, edison bulb, exposed wire, matte black, industrial, raw'),
        ('IND-005', 'Wire Mesh Cabinet', 'Storage', 250.00, ind_img, 'metal, wire mesh, industrial, dark gray, urban loft, steel'),
        ('IND-006', 'Reclaimed Wood Dining Table', 'Dining', 600.00, ind_img, 'reclaimed wood, raw steel, heavy, industrial, dark wood, rustic'),
        ('IND-007', 'Gunmetal Bar Stools (Set of 2)', 'Dining', 150.00, ind_img, 'bar stool, gunmetal, steel, industrial, urban, dark'),
        ('IND-008', 'Faux Brick Wallpaper', 'Decor', 45.00, ind_img, 'wallpaper, brick, industrial, loft, dark, urban'),
        ('IND-009', 'Metal Factory Floor Lamp', 'Lighting', 110.00, ind_img, 'floor lamp, metal, factory style, matte black, industrial, dark'),
        ('IND-010', 'Iron Platform Bed', 'Bedroom', 400.00, ind_img, 'bed, iron, matte black, heavy, industrial, urban loft'),

        # Coastal/Boho (10 items)
        ('BOH-001', 'Rattan Lounge Chair', 'Seating', 220.00, cst_img, 'rattan, coastal, boho, airy, light wood, breezy, woven'),
        ('BOH-002', 'Macrame Wall Hanging', 'Decor', 65.00, cst_img, 'macrame, boho, textile, woven, coastal, airy, white'),
        ('BOH-003', 'Linen Slipcover Sofa', 'Living Room', 950.00, cst_img, 'linen, white sofa, coastal, relaxed, breezy, boho, comfortable'),
        ('BOH-004', 'Jute Area Rug', 'Rugs', 180.00, cst_img, 'jute, woven, natural, boho, coastal, light, textured'),
        ('BOH-005', 'Whitewashed Wood Coffee Table', 'Living Room', 280.00, cst_img, 'coffee table, whitewashed, light wood, coastal, breezy, airy'),
        ('BOH-006', 'Bamboo Pendant Light', 'Lighting', 130.00, cst_img, 'lighting, bamboo, woven, coastal, boho, airy, natural'),
        ('BOH-007', 'Fringed Throw Pillow', 'Decor', 35.00, cst_img, 'pillow, fringe, boho, textured, coastal, relaxed, natural'),
        ('BOH-008', 'Teak Outdoor Lounge', 'Patio', 450.00, cst_img, 'teak, outdoor, coastal, relaxed, breezy, light wood, natural'),
        ('BOH-009', 'Seagrass Baskets (Set of 3)', 'Storage', 75.00, cst_img, 'seagrass, woven, basket, coastal, boho, airy, natural'),
        ('BOH-010', 'Canopy Bed Frame', 'Bedroom', 700.00, cst_img, 'bed, canopy, light wood, airy, coastal, boho, dreamy')
    ]

    cursor.executemany('INSERT INTO products VALUES (?,?,?,?,?,?)', products)

    conn.commit()
    conn.close()
    print("wayfair_catalog.db has been created with 30 items.")

if __name__ == '__main__':
    setup_catalog()
