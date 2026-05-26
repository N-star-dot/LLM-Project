import re

def update_app():
    with open('app.py', 'r') as f:
        content = f.read()
    
    # 1. Update set_page_config
    content = content.replace(
        'st.set_page_config(page_title="Acuman AI", page_icon="🌊", layout="wide")',
        'st.set_page_config(page_title="Wayfair CSR Dashboard", page_icon="🛒", layout="wide")'
    )
    
    # 2. Update theme css completely
    # We will find the start of the theme engine and end of the wordmark section
    start_str = '# --- DYNAMIC THEME ENGINE ---'
    end_str = '# ── HAIKU TIME LOGIC ──'
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx != -1 and end_idx != -1:
        wayfair_css = '''# --- DYNAMIC THEME ENGINE ---
is_cloud = False

# Shared font import
FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');"
ACCENT_U = "#7F187F"
ACCENT_U_LOCAL = "#7F187F"

theme_css = f"""
<style>
{FONT_IMPORT}
/* ── Base ── */
html, body, [data-testid="stAppViewContainer"] {{
    font-family: 'Inter', sans-serif;
    background: #f8f8f8;
    color: #333333;
}}
[data-testid="stAppViewContainer"] {{
    background: #ffffff;
}}
[data-testid="stHeader"] {{ background: transparent; }}

/* ── Wordmark ── */
.acuman-wordmark {{
    font-family: 'Inter', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: #7F187F;
    line-height: 1.2;
    margin: 0.5rem 0 0.25rem 0;
}}
.acuman-sub {{
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    font-weight: 400;
    color: #666666;
    margin-top: 0;
}}

/* ── Headings ── */
h1, h2, h3 {{
    font-family: 'Inter', sans-serif !important;
    color: #333333 !important;
    font-weight: 600 !important;
}}

/* ── Sidebar ── */
[data-testid="stSidebar"] {{
    background: #f4f4f4 !important;
    border-right: 1px solid #e0e0e0 !important;
    padding: 1.5rem 0 !important;
}}
[data-testid="stSidebar"] p,
[data-testid="stSidebar"] label,
[data-testid="stSidebar"] div[data-testid="stMarkdownContainer"] > p {{
    color: #555555 !important;
    font-family: 'Inter', sans-serif !important;
}}
[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 {{
    color: #7F187F !important;
}}

/* ── Chat Bubbles ── */
[data-testid="stChatMessage"] {{
    background: #ffffff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    border: 1px solid #e0e0e0;
    color: #333333;
    margin-bottom: 1rem;
}}

/* ── Chat Input ── */
[data-testid="stChatInputContainer"] > div,
.stChatInput > div {{
    background: #ffffff !important;
    border: 1px solid #cccccc !important;
    border-radius: 8px !important;
}}

/* ── Buttons ── */
.stButton > button {{
    background: #7F187F !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 4px !important;
    font-family: 'Inter', sans-serif !important;
    font-weight: 500 !important;
}}
.stButton > button:hover {{
    background: #5d115d !important;
}}

/* ── Slider ── */
.stSlider > div > div > div {{
    background-color: {ACCENT_U} !important;
}}
</style>
"""

st.markdown(theme_css, unsafe_allow_html=True)

# ── Wayfair Wordmark ──
st.markdown(
    f"""
    <div class="acuman-wordmark">Wayfair</div>
    <p class="acuman-sub">Internal CSR Dashboard</p>
    """,
    unsafe_allow_html=True
)

'''
        content = content[:start_idx] + wayfair_css + content[end_idx:]

    with open('app.py', 'w') as f:
        f.write(content)
        
if __name__ == "__main__":
    update_app()
