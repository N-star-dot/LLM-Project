import sqlite3
import os

DB_PATH = 'backend/wayfair_catalog.db'
IMAGES_DIR = 'images'
BASE_URL = 'http://192.168.106.212:8000/images'

def update_images():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get images
    images = [f for f in os.listdir(IMAGES_DIR) if f.endswith('.png')]
    images.sort()
    
    # Get all product IDs
    cursor.execute('SELECT id FROM products ORDER BY id')
    products = cursor.fetchall()
    
    for i, (prod_id,) in enumerate(products):
        if i < len(images):
            # Assign real image
            img_url = f"{BASE_URL}/{images[i]}"
        else:
            # Wrap around if we run out of images
            img_url = f"{BASE_URL}/{images[i % len(images)]}"
            
        cursor.execute('UPDATE products SET image_url = ? WHERE id = ?', (img_url, prod_id))
        
    conn.commit()
    conn.close()
    print("Database updated with real images!")

if __name__ == '__main__':
    update_images()
