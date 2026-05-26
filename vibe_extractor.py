"""
VLM Vibe Extractor — Streamlit Demo Page
=========================================
Two modes:
  1. MANUAL: Upload a single product image → extract vibe
  2. AGENT:  Point at a folder → agent crawls & processes ALL images autonomously
"""

import streamlit as st
import base64
import json
import os
import vlm_agent
import vibe_agent

st.set_page_config(page_title="Vibe Agent | Asteralyze*", page_icon="✦", layout="wide")

# --- Premium Dark Theme ---
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

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
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0a0a0f 0%, #12121f 100%) !important;
    border-right: 1px solid rgba(167, 139, 250, 0.1) !important;
}
[data-testid="stSidebar"] p, [data-testid="stSidebar"] label,
[data-testid="stSidebar"] div[data-testid="stMarkdownContainer"] > p {
    color: #b0b0c0 !important;
}

h1, h2, h3 {
    font-family: 'Space Grotesk', sans-serif !important;
    color: #ffffff !important;
    font-weight: 600 !important;
}
p, label, .stMarkdown, [data-testid="stMarkdownContainer"] > p {
    color: #b0b0c0 !important;
    font-family: 'Inter', sans-serif !important;
}

/* Hero */
.vibe-hero {
    text-align: center;
    padding: 1.5rem 0 1rem 0;
}
.vibe-hero h1 {
    font-family: 'Space Grotesk', sans-serif !important;
    font-size: 2.8rem !important;
    font-weight: 700 !important;
    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #f59e0b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.3rem;
}
.vibe-hero p {
    font-size: 1.05rem;
    color: #6b6b80 !important;
    font-weight: 300;
}

/* Upload zone */
[data-testid="stFileUploader"] {
    border: 2px dashed rgba(167, 139, 250, 0.25) !important;
    border-radius: 16px !important;
    padding: 1.5rem !important;
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
    padding: 0.7rem 1.5rem !important;
    font-size: 0.95rem !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25) !important;
}
.stButton > button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4) !important;
}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    background: transparent;
}
.stTabs [data-baseweb="tab"] {
    background: rgba(167, 139, 250, 0.06);
    border: 1px solid rgba(167, 139, 250, 0.15);
    border-radius: 10px;
    color: #b0b0c0 !important;
    font-family: 'Space Grotesk', sans-serif !important;
    font-weight: 500;
    padding: 8px 20px;
}
.stTabs [aria-selected="true"] {
    background: rgba(167, 139, 250, 0.15) !important;
    border-color: rgba(167, 139, 250, 0.4) !important;
    color: #a78bfa !important;
}
.stTabs [data-baseweb="tab-highlight"] {
    background-color: #a78bfa !important;
}

/* Expander */
[data-testid="stExpander"] {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 12px;
}

pre {
    background: rgba(0,0,0,0.4) !important;
    border: 1px solid rgba(167, 139, 250, 0.12) !important;
    border-radius: 12px !important;
}

/* Agent status card */
.agent-status {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(99, 102, 241, 0.05));
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 14px;
    padding: 18px 22px;
    margin: 12px 0;
}
.agent-status h4 {
    color: #a78bfa !important;
    font-family: 'Space Grotesk', sans-serif !important;
    margin: 0 0 6px 0;
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

/* Ambient glow */
.ambient-glow {
    position: fixed;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(ellipse at 30% 20%, rgba(124, 58, 237, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.03) 0%, transparent 50%);
    pointer-events: none; z-index: -1;
    animation: glow-drift 15s ease-in-out infinite alternate;
}
@keyframes glow-drift {
    0% { transform: translate(0, 0); }
    100% { transform: translate(-5%, 3%); }
}

/* Metric cards */
[data-testid="stMetric"] {
    background: rgba(167, 139, 250, 0.06);
    border: 1px solid rgba(167, 139, 250, 0.12);
    border-radius: 12px;
    padding: 12px 16px;
}
[data-testid="stMetricValue"] {
    color: #a78bfa !important;
    font-family: 'Space Grotesk', sans-serif !important;
}
[data-testid="stMetricLabel"] {
    color: #6b6b80 !important;
}

/* Text input */
.stTextInput > div > div > input {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(167, 139, 250, 0.2) !important;
    border-radius: 10px !important;
    color: #e8e8ed !important;
    font-family: 'Inter', sans-serif !important;
}
</style>

<div class="ambient-glow"></div>
""", unsafe_allow_html=True)

# --- Hero ---
st.markdown("""
<div class="vibe-hero">
    <h1>✦ Vibe Agent</h1>
    <p>Autonomous VLM pipeline — crawls, extracts, reasons, saves. No human needed.</p>
</div>
""", unsafe_allow_html=True)

# --- Two Modes ---
tab_agent, tab_manual = st.tabs(["🤖 Autonomous Agent", "🔍 Single Image"])

# ============================
# TAB 1: AUTONOMOUS AGENT
# ============================
with tab_agent:
    st.markdown("### Point the agent at a folder of product images")
    st.caption("The agent will autonomously crawl every image, extract vibes via VLM, reason about overlaps and confidence, and save everything to the catalog.")

    col_config, col_status = st.columns([1, 1], gap="large")

    with col_config:
        folder_path = st.text_input(
            "📂 Product images folder",
            value="",
            placeholder="D:\\path\\to\\product_images",
            help="Path to a folder containing product photos (JPG, PNG, WebP)"
        )

        # Also support uploading multiple files directly
        st.markdown("**— or upload images directly —**")
        uploaded_files = st.file_uploader(
            "Drop product images here",
            type=["png", "jpg", "jpeg", "webp"],
            accept_multiple_files=True,
            label_visibility="collapsed",
            key="agent_uploader"
        )

        run_agent = st.button("🚀 Run Autonomous Agent", use_container_width=True, key="run_agent")

    with col_status:
        catalog = vlm_agent.load_catalog()
        vibe_counts = {}
        for item in catalog:
            v = item.get("primary_vibe", "unknown")
            vibe_counts[v] = vibe_counts.get(v, 0) + 1

        st.markdown("""<div class="agent-status"><h4>Current Catalog</h4></div>""", unsafe_allow_html=True)
        st.metric("Total Products", len(catalog))

        # Show vibe distribution
        if vibe_counts:
            top_vibes = sorted(vibe_counts.items(), key=lambda x: -x[1])[:4]
            vibe_cols = st.columns(len(top_vibes))
            for j, (vibe, count) in enumerate(top_vibes):
                with vibe_cols[j]:
                    st.metric(vibe.title(), count)

    # --- Run the agent ---
    if run_agent:
        if uploaded_files:
            # Save uploaded files to a temp folder inside the project
            temp_folder = os.path.join(os.path.dirname(__file__), "_agent_inbox")
            os.makedirs(temp_folder, exist_ok=True)

            for uf in uploaded_files:
                with open(os.path.join(temp_folder, uf.name), "wb") as f:
                    f.write(uf.getbuffer())

            st.markdown("---")
            st.write_stream(vibe_agent.stream_agent_run(temp_folder))

        elif folder_path and os.path.isdir(folder_path):
            st.markdown("---")
            st.write_stream(vibe_agent.stream_agent_run(folder_path))

        else:
            st.error("Please provide a valid folder path or upload images.")


# ============================
# TAB 2: SINGLE IMAGE (Manual)
# ============================
with tab_manual:
    col_upload, col_result = st.columns([1, 1], gap="large")

    with col_upload:
        st.markdown("### 📸 Upload Single Product Image")

        uploaded_file = st.file_uploader(
            "Drop a product image",
            type=["png", "jpg", "jpeg", "webp"],
            label_visibility="collapsed",
            key="manual_uploader"
        )

        if uploaded_file:
            img_bytes = uploaded_file.read()
            st.image(img_bytes, caption=uploaded_file.name, use_container_width=True)

            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
            mime = uploaded_file.type or "image/jpeg"

            col_e, col_s = st.columns(2)
            with col_e:
                extract_btn = st.button("🔍 Extract Vibe", use_container_width=True, key="extract")
            with col_s:
                save_btn = st.button("💾 Extract & Save", use_container_width=True, key="save")

            if extract_btn or save_btn:
                with col_result:
                    st.markdown("### 🧠 Agent Pipeline")
                    result_placeholder = st.empty()
                    full_output = ""
                    for chunk in vlm_agent.stream_vibe_extraction(img_b64, mime):
                        full_output += chunk
                        result_placeholder.markdown(full_output)

                    if save_btn:
                        st.markdown("---")
                        with st.spinner("Saving to catalog..."):
                            saved = vlm_agent.ingest_and_save(img_b64, mime)
                            if saved and "error" not in saved:
                                st.success(f"✅ Saved **{saved.get('name')}** (ID: {saved.get('id')})")
                                st.balloons()
                            else:
                                st.error(f"Failed: {saved}")

# --- Catalog Viewer ---
st.markdown("---")
with st.expander("📊 Full Catalog Viewer", expanded=False):
    catalog = vlm_agent.load_catalog()
    if catalog:
        for item in catalog:
            st.markdown(f"**{item.get('id')}.** {item.get('name')} — *{item.get('primary_vibe')}* — ${item.get('price', 0)}")
        st.caption(f"{len(catalog)} products total")
    else:
        st.info("Catalog is empty.")
