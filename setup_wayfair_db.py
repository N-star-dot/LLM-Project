import sqlite3
import datetime

def setup_db():
    conn = sqlite3.connect('wayfair_mock.db')
    cursor = conn.cursor()

    # Drop tables if they exist
    cursor.execute('DROP TABLE IF EXISTS orders')
    cursor.execute('DROP TABLE IF EXISTS shipments')
    cursor.execute('DROP TABLE IF EXISTS payments')

    # Create tables
    cursor.execute('''
        CREATE TABLE orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT,
            customer_name TEXT,
            order_date DATE,
            total_amount REAL,
            status TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE shipments (
            shipment_id TEXT PRIMARY KEY,
            order_id TEXT,
            carrier TEXT,
            tracking_number TEXT,
            shipment_date DATE,
            delivery_date DATE,
            status TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE payments (
            payment_id TEXT PRIMARY KEY,
            order_id TEXT,
            payment_method TEXT,
            amount REAL,
            payment_status TEXT,
            transaction_date DATE,
            FOREIGN KEY (order_id) REFERENCES orders (order_id)
        )
    ''')

    # Insert dummy data
    today = datetime.date.today()
    
    # Case 1: Delivered 35 days ago (not eligible for refund)
    order_date_1 = today - datetime.timedelta(days=40)
    ship_date_1 = today - datetime.timedelta(days=38)
    delivery_date_1 = today - datetime.timedelta(days=35)
    
    # Case 2: Delivered 15 days ago (eligible for refund)
    order_date_2 = today - datetime.timedelta(days=20)
    ship_date_2 = today - datetime.timedelta(days=18)
    delivery_date_2 = today - datetime.timedelta(days=15)
    
    # Case 3: In transit
    order_date_3 = today - datetime.timedelta(days=3)
    ship_date_3 = today - datetime.timedelta(days=1)
    
    cursor.executemany('INSERT INTO orders VALUES (?,?,?,?,?,?)', [
        ('ORD-1001', 'C-001', 'Alice Smith', order_date_1.isoformat(), 159.99, 'Delivered'),
        ('ORD-1002', 'C-002', 'Bob Johnson', order_date_2.isoformat(), 499.50, 'Delivered'),
        ('ORD-1003', 'C-003', 'Charlie Brown', order_date_3.isoformat(), 89.00, 'Shipped'),
    ])

    cursor.executemany('INSERT INTO shipments VALUES (?,?,?,?,?,?,?)', [
        ('SHP-5001', 'ORD-1001', 'FedEx', 'FX123456789', ship_date_1.isoformat(), delivery_date_1.isoformat(), 'Delivered'),
        ('SHP-5002', 'ORD-1002', 'UPS', '1Z999999999', ship_date_2.isoformat(), delivery_date_2.isoformat(), 'Delivered'),
        ('SHP-5003', 'ORD-1003', 'USPS', '94001000000', ship_date_3.isoformat(), None, 'In Transit'),
    ])

    cursor.executemany('INSERT INTO payments VALUES (?,?,?,?,?,?)', [
        ('PAY-9001', 'ORD-1001', 'Credit Card', 159.99, 'Completed', order_date_1.isoformat()),
        ('PAY-9002', 'ORD-1002', 'PayPal', 499.50, 'Completed', order_date_2.isoformat()),
        ('PAY-9003', 'ORD-1003', 'Credit Card', 89.00, 'Completed', order_date_3.isoformat()),
    ])

    conn.commit()
    conn.close()
    print("wayfair_mock.db has been created and populated.")

if __name__ == '__main__':
    setup_db()
