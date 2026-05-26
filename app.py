import streamlit as st
import agent

st.set_page_config(page_title="Wayfair Aesthetic Matchmaker", page_icon="🪑", layout="wide")

# Custom CSS for the Pinterest-style grid and Wayfair styling
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    
    html, body, [class*="st-"] {
        font-family: 'Inter', sans-serif;
    }
    
    .main-title {
        color: #7F187F;
        font-weight: 700;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .sub-title {
        color: #666666;
        text-align: center;
        margin-bottom: 2rem;
        font-size: 1.1rem;
    }
    
    /* Product Card Styling */
    .product-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        overflow: hidden;
        margin-bottom: 1.5rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .product-img {
        width: 100%;
        height: 250px;
        object-fit: cover;
    }
    
    .product-info {
        padding: 16px;
    }
    
    .product-name {
        font-weight: 600;
        color: #333333;
        font-size: 1.05rem;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .product-price {
        font-weight: 700;
        color: #7F187F;
        font-size: 1.2rem;
        margin-bottom: 12px;
    }
    
    .product-category {
        font-size: 0.8rem;
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
    }
    
    /* Wayfair Button */
    .cart-btn {
        display: block;
        width: 100%;
        text-align: center;
        background-color: #7F187F;
        color: white;
        padding: 10px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    
    .cart-btn:hover {
        background-color: #5d115d;
        color: white;
    }

    /* Fallback alert */
    .fallback-alert {
        background-color: #f8f0f8;
        border-left: 4px solid #7F187F;
        padding: 1rem;
        border-radius: 4px;
        color: #333;
        margin-bottom: 2rem;
        font-weight: 500;
    }
    </style>
""", unsafe_allow_html=True)

st.markdown('<h1 class="main-title">Wayfair Aesthetic Matchmaker</h1>', unsafe_allow_html=True)
st.markdown('<p class="sub-title">Describe your dream room vibe, and our AI will find the perfect pieces.</p>', unsafe_allow_html=True)

# Search Bar
vibe_query = st.text_input("Describe your vibe...", placeholder="e.g. moody industrial loft with exposed brick and dark leather", max_chars=200)

if vibe_query:
    with st.spinner("Translating your aesthetic..."):
        # Call the Agent
        agent_msg, products_df, fallback_triggered = agent.ask_agent(vibe_query)
        
        # If the fallback loop was triggered, display the graceful fallback message
        if fallback_triggered:
            st.markdown(f'<div class="fallback-alert">✨ {agent_msg}</div>', unsafe_allow_html=True)
        else:
            st.success(agent_msg)
            
        st.divider()

        if products_df is not None and not products_df.empty:
            # Render Masonry Grid using st.columns
            # We use 3 columns for the grid
            cols = st.columns(3)
            
            for index, row in products_df.iterrows():
                # Distribute items across the 3 columns
                col = cols[index % 3]
                
                with col:
                    # Render the custom HTML product card
                    card_html = f"""
                    <div class="product-card">
                        <img src="{row['image_url']}" class="product-img" alt="{row['name']}">
                        <div class="product-info">
                            <div class="product-category">{row['category']}</div>
                            <div class="product-name">{row['name']}</div>
                            <div class="product-price">${row['price']:.2f}</div>
                            <a href="#" class="cart-btn" onclick="alert('Added to cart!'); return false;">Add to Cart</a>
                        </div>
                    </div>
                    """
                    st.markdown(card_html, unsafe_allow_html=True)
        else:
            if not fallback_triggered:
                st.warning("No products found for this aesthetic.")
else:
    # Default landing state - show some inspiration
    st.markdown("### 💡 Try searching for:")
    col1, col2, col3 = st.columns(3)
    col1.info('"A breezy coastal living room with lots of natural light and woven textures"')
    col2.info('"Cyberpunk gamer room with neon lights and dark metals"')
    col3.info('"Retro 1960s lounge with warm woods and mustard velvet"')