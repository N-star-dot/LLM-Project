import json
import sqlite3

def setup_db():
    # We will update the backend database directly
    conn = sqlite3.connect('backend/wayfair_catalog.db')
    cursor = conn.cursor()

    # Create new table schema
    cursor.execute('DROP TABLE IF EXISTS products')
    cursor.execute('''
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL,
        width_in REAL,
        height_in REAL,
        depth_in REAL,
        primary_vibe TEXT,
        color_palette TEXT,
        style_tags TEXT,
        vibe_description TEXT,
        image_url TEXT
    )
    ''')

    # Load JSON
    with open('mockdata.json', 'r') as f:
        data = json.load(f)

    # Insert data
    for item in data:
        # Convert list to comma-separated string for SQLite
        colors = ", ".join(item.get("color_palette", []))
        tags = ", ".join(item.get("style_tags", []))
        
        # We need an image_url for the mobile app UI. Let's use a placeholder if not present.
        image_url = item.get("image_url", "https://via.placeholder.com/400x400/7F187F/ffffff?text=" + item["name"].replace(" ", "+"))

        cursor.execute('''
        INSERT INTO products 
        (id, name, category, price, width_in, height_in, depth_in, primary_vibe, color_palette, style_tags, vibe_description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item["id"],
            item["name"],
            item["category"],
            item["price"],
            item.get("width_in"),
            item.get("height_in"),
            item.get("depth_in"),
            item["primary_vibe"],
            colors,
            tags,
            item["vibe_description"],
            image_url
        ))

    conn.commit()
    conn.close()
    print("Database updated successfully with mockdata.json.")

if __name__ == "__main__":
    setup_db()
