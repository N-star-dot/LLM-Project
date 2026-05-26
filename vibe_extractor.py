"""
VLM Vibe Extractor — Streamlit Demo Page
=========================================
Upload a product image → watch the agent extract the vibe live.
"""

import streamlit as st
import base64
import json
import vlm_agent

st.set_page_config(page_title="Vibe Extractor | Asteralyze*", page_icon="✦", layout="wide")

# --- Premium Dark Theme ---
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

/* Base */
html, body, [data-testid="stAppViewContainer"] {
    font-family: 'Inter', sans-serif;
    background: #0a0a0f;
    color: #e8e8ed;
}
[data-testid="stAppViewContainer"] {
    background: linear-gradient(160deg, #0a0a0f 0%, #0f0f1a 40%, #0a0a0f 100%);
    background-attachment: fixed;
}
[data-testid="stHeader"] { background: transparent; }
[data-testid="stSidebar"] { display: none; }

/* Typography */
h1, h2, h3 {
    font-family: 'Space Grotesk', sans-serif !important;
    color: #ffffff !important;
    font-weight: 600 !important;
}
p, label, .stMarkdown, [data-testid="stMarkdownContainer"] > p {
    color: #b0b0c0 !important;
    font-family: 'Inter', sans-serif !important;
}

/* Accent colors */
.vibe-accent { color: #a78bfa; }
.vibe-accent-warm { color: #f59e0b; }

/* Hero wordmark */
.vibe-hero {
    text-align: center;
    padding: 2rem 0 1rem 0;
}
.vibe-hero h1 {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 2.8rem !important;
    font-weight: 700 !important;
    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #f59e0b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
}
.vibe-hero p {
    font-size: 1.1rem;
    color: #6b6b80 !important;
    font-weight: 300;
}

/* Upload zone */
[data-testid="stFileUploader"] {
    border: 2px dashed rgba(167, 139, 250, 0.25) !important;
    border-radius: 16px !important;
    padding: 2rem !important;
    background: rgba(167, 139, 250, 0.04) !important;
    transition: all 0.3s ease;
}
[data-testid="stFileUploader"]:hover {
    border-color: rgba(167, 139, 250, 0.5) !important;
    background: rgba(167, 139, 250, 0.08) !important;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #7c3aed, #6366f1) !important;
    color: white !important;
    border: none !important;
    border-radius: 12px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 600 !important;
    padding: 0.75rem 2rem !important;
    font-size: 1rem !important;
    letter-spacing: 0.02em !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3) !important;
}
.stButton > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.5) !important;
}

/* Chat/response messages */
[data-testid="stChatMessage"] {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 16px;
    padding: 20px 24px;
    backdrop-filter: blur(10px);
}

/* Expander */
[data-testid="stExpander"] {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(167, 139, 250, 0.12);
    border-radius: 12px;
}

/* Code blocks */
pre {
    background: rgba(0,0,0,0.4) !important;
    border: 1px solid rgba(167, 139, 250, 0.15) !important;
    border-radius: 12px !important;
}

/* Result card */
.result-card {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(245, 158, 11, 0.04));
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 16px;
    padding: 24px;
    margin: 16px 0;
}
.result-card h3 {
    margin: 0 0 8px 0;
    font-size: 1.3rem;
}
.result-vibe-badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    background: rgba(167, 139, 250, 0.15);
    color: #a78bfa;
    border: 1px solid rgba(167, 139, 250, 0.3);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.confidence-bar {
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.08);
    margin: 8px 0;
    overflow: hidden;
}
.confidence-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    transition: width 1s ease;
}
.color-dot {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-right: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    vertical-align: middle;
}
.tag-chip {
    display: inline-block;
    padding: 3px 10px;
    margin: 2px;
    border-radius: 12px;
    font-size: 0.78rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #b0b0c0;
}

/* Ambient glow */
.ambient-glow {
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at 30% 20%, rgba(124, 58, 237, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
    animation: glow-drift 15s ease-in-out infinite alternate;
}
@keyframes glow-drift {
    0% { transform: translate(0, 0); }
    100% { transform: translate(-5%, 3%); }
}
</style>

<div class="ambient-glow"></div>
""", unsafe_allow_html=True)

# --- Hero ---
st.markdown("""
<div class="vibe-hero">
    <h1>✦ Vibe Extractor</h1>
    <p>Upload a product image. The VLM agent extracts the aesthetic DNA.</p>
</div>
""", unsafe_allow_html=True)

# --- Layout ---
col_upload, col_result = st.columns([1, 1], gap="large")

with col_upload:
    st.markdown("### 📸 Upload Product Image")
    
    uploaded_file = st.file_uploader(
        "Drop a product image",
        type=["png", "jpg", "jpeg", "webp"],
        label_visibility="collapsed"
    )
    
    if uploaded_file:
        img_bytes = uploaded_file.read()
        st.image(img_bytes, caption=uploaded_file.name, use_container_width=True)
        
        # Encode
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        mime = uploaded_file.type or "image/jpeg"
        
        col_extract, col_save = st.columns(2)
        with col_extract:
            extract_btn = st.button("🔍 Extract Vibe", use_container_width=True, key="extract")
        with col_save:
            save_btn = st.button("💾 Extract & Save to Catalog", use_container_width=True, key="save")
        
        if extract_btn or save_btn:
            with col_result:
                st.markdown("### 🧠 Agent Pipeline")
                
                # Stream the extraction live
                result_placeholder = st.empty()
                full_output = ""
                
                for chunk in vlm_agent.stream_vibe_extraction(img_b64, mime):
                    full_output += chunk
                    result_placeholder.markdown(full_output)
                
                # If save requested, also persist
                if save_btn:
                    st.markdown("---")
                    with st.spinner("Saving to catalog..."):
                        saved = vlm_agent.ingest_and_save(img_b64, mime)
                        if saved and "error" not in saved:
                            st.success(f"✅ Saved as **{saved.get('name')}** (ID: {saved.get('id')}) to mockdata.json!")
                            st.balloons()
                        else:
                            st.error(f"Failed to save: {saved}")

# --- Show current catalog stats ---
st.markdown("---")
catalog = vlm_agent.load_catalog()
if catalog:
    st.markdown("### 📊 Current Catalog")
    
    vibe_counts = {}
    for item in catalog:
        v = item.get("primary_vibe", "unknown")
        vibe_counts[v] = vibe_counts.get(v, 0) + 1
    
    # Stats row
    cols = st.columns(len(vibe_counts))
    for i, (vibe, count) in enumerate(sorted(vibe_counts.items(), key=lambda x: -x[1])):
        with cols[i % len(cols)]:
            st.metric(vibe.title(), count)
    
    st.caption(f"**{len(catalog)} total products** across {len(vibe_counts)} vibes")
