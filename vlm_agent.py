"""
VLM Vibe Extraction Agent — Pinterest Pipeline
================================================
Ingests product images via Groq Vision (Llama 4 Scout),
extracts aesthetic vocabulary, color palette, mood, style tags,
and vibe descriptions in the exact format of mockdata.json.

Agentic behavior: cross-references extracted vibes against the
existing catalog to reason about confidence, overlap, and edge cases.
"""

import os
import json
import base64
import groq
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _client

# --- Load existing catalog vibes for cross-referencing ---
CATALOG_PATH = os.path.join(os.path.dirname(__file__), "mockdata.json")

def load_catalog():
    try:
        with open(CATALOG_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return []

KNOWN_VIBES = [
    "dark academia", "scandinavian minimalist", "mid-century modern",
    "cottagecore", "industrial", "bohemian", "coastal", "japandi", "art deco"
]

# --- PHASE 1: Raw VLM Extraction ---
def extract_raw_vibe(image_b64, mime_type="image/jpeg"):
    """
    Sends image to VLM and extracts raw aesthetic vocabulary.
    Returns structured JSON matching mockdata.json format.
    """
    extraction_prompt = """You are an elite furniture & interior design analyst for a major home goods retailer.

Analyze this product image and extract the following in valid JSON format:

{
    "name": "A creative, evocative product name (e.g. 'Ashford Velvet Reading Chair')",
    "category": "one of: chair, sofa, coffee_table, side_table, desk, bookshelf, bed_frame, dining_table, credenza, ottoman, lamp, rug, mirror, dresser, nightstand",
    "price": estimated retail price as integer (USD),
    "width_in": estimated width in inches,
    "height_in": estimated height in inches,
    "depth_in": estimated depth in inches,
    "primary_vibe": "the single BEST matching aesthetic from this list: dark academia, scandinavian minimalist, mid-century modern, cottagecore, industrial, bohemian, coastal, japandi, art deco. Pick the closest one.",
    "color_palette": ["list", "of", "4-5", "specific color names like 'midnight blue', 'aged brass', 'natural oak'"],
    "style_tags": ["list of 8-12 evocative single/double-word tags capturing material, era, mood, texture, shape — e.g. 'velvet', 'tufted', 'Victorian', 'scholarly', 'moody', 'jewel-toned'"],
    "vibe_description": "A rich 2-3 sentence description written like a premium furniture copywriter. Evoke the FEELING and ATMOSPHERE, not just the physical features. Use sensory language. Make the reader feel the room this piece creates."
}

CRITICAL RULES:
- Output ONLY valid JSON, no markdown fences, no explanation
- The vibe_description should be LITERARY and EVOCATIVE, not a dry spec sheet
- Style tags should capture things a human would FEEL, not just SEE
- Color palette should use poetic, specific names (not "blue" — say "midnight blue" or "dusty slate")
- Be opinionated about the vibe — commit to it"""

    try:
        response = get_client().chat.completions.create(
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": extraction_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_b64}"
                        }
                    }
                ]
            }],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            temperature=0.3,
            max_tokens=1500,
        )
        raw = response.choices[0].message.content
        # Extract JSON from response
        start = raw.find('{')
        end = raw.rfind('}')
        if start != -1 and end > start:
            return json.loads(raw[start:end + 1])
        return None
    except groq.RateLimitError:
        return {"error": "Rate limit exceeded. Wait a moment and try again."}
    except Exception as e:
        return {"error": f"VLM extraction failed: {e}"}


# --- PHASE 2: Agentic Reasoning ---
def reason_about_vibes(extracted_data, catalog=None):
    """
    The AGENTIC part: takes raw VLM extraction and reasons about it.
    Cross-references against existing catalog vibes, detects overlaps,
    assigns confidence scores, and makes judgment calls.
    """
    if not extracted_data or "error" in extracted_data:
        return extracted_data

    if catalog is None:
        catalog = load_catalog()

    # Build context about what vibes exist in catalog
    vibe_counts = {}
    vibe_tags = {}
    for item in catalog:
        v = item.get("primary_vibe", "")
        vibe_counts[v] = vibe_counts.get(v, 0) + 1
        if v not in vibe_tags:
            vibe_tags[v] = set()
        for tag in item.get("style_tags", []):
            vibe_tags[v].add(tag)

    reasoning_prompt = f"""You are a senior design curator reviewing an AI's initial vibe extraction for a furniture product.

Here is the raw extraction:
{json.dumps(extracted_data, indent=2)}

Here is the existing catalog's vibe distribution:
{json.dumps(vibe_counts, indent=2)}

Here are the style tags already associated with each vibe in our catalog:
{json.dumps({k: list(v)[:15] for k, v in vibe_tags.items()}, indent=2)}

Your job is to REASON and REFINE:

1. CONFIRM or CHANGE the primary_vibe — does it truly fit? Or is there a better match given our catalog's existing patterns?
2. DETECT OVERLAPS — does this product span two vibes? If so, which secondary vibe applies?
3. CONFIDENCE — how confident are you in the primary vibe assignment? (0.0 to 1.0)
4. REFINE the style_tags — add any missing tags that our catalog associates with this vibe, remove any that feel wrong
5. REFINE the vibe_description — make it match the literary quality of our existing catalog descriptions

Output a FINAL refined JSON with these ADDITIONAL fields added:
- "secondary_vibe": string or null (if it overlaps another aesthetic)
- "vibe_confidence": float 0.0-1.0
- "reasoning": "one sentence explaining your judgment call"

Output ONLY the final JSON, no markdown fences, no extra text."""

    try:
        response = get_client().chat.completions.create(
            messages=[{"role": "user", "content": reasoning_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
        )
        raw = response.choices[0].message.content
        start = raw.find('{')
        end = raw.rfind('}')
        if start != -1 and end > start:
            refined = json.loads(raw[start:end + 1])
            return refined
        return extracted_data
    except Exception:
        # If reasoning fails, return raw extraction (graceful degradation)
        return extracted_data


# --- PHASE 3: Full Pipeline ---
def ingest_product_image(image_b64, mime_type="image/jpeg", next_id=None):
    """
    Full agentic pipeline:
    1. VLM extracts raw vibe from image
    2. Agent reasons about overlaps, confidence, and fit
    3. Returns final product entry ready to append to catalog
    """
    catalog = load_catalog()

    if next_id is None:
        next_id = max((item.get("id", 0) for item in catalog), default=0) + 1

    # Phase 1: Raw extraction
    raw_extraction = extract_raw_vibe(image_b64, mime_type)
    if not raw_extraction or "error" in raw_extraction:
        return raw_extraction

    # Phase 2: Agentic reasoning
    refined = reason_about_vibes(raw_extraction, catalog)
    if not refined or "error" in refined:
        return refined

    # Assign ID
    refined["id"] = next_id

    # Ensure all required fields exist with fallbacks
    required_fields = {
        "name": "Unnamed Product",
        "category": "furniture",
        "price": 0,
        "width_in": 0,
        "height_in": 0,
        "depth_in": 0,
        "primary_vibe": "unknown",
        "color_palette": [],
        "style_tags": [],
        "vibe_description": ""
    }
    for field, default in required_fields.items():
        if field not in refined:
            refined[field] = default

    return refined


def ingest_and_save(image_b64, mime_type="image/jpeg"):
    """
    Ingests a product image and appends the result to mockdata.json.
    Returns the new product entry.
    """
    result = ingest_product_image(image_b64, mime_type)
    if not result or "error" in result:
        return result

    # Load, append, save
    catalog = load_catalog()
    catalog.append(result)
    try:
        with open(CATALOG_PATH, "w") as f:
            json.dump(catalog, f, indent=4)
    except Exception as e:
        result["_save_warning"] = f"Product extracted but failed to save: {e}"

    return result


# --- Streaming version for the UI ---
def stream_vibe_extraction(image_b64, mime_type="image/jpeg"):
    """
    Generator that yields status updates during the pipeline.
    Used by the Streamlit UI for live feedback.
    """
    yield "🔍 **Phase 1:** Sending image to VLM for raw vibe extraction...\n\n"

    raw = extract_raw_vibe(image_b64, mime_type)
    if not raw or "error" in raw:
        yield f"❌ Extraction failed: {raw}\n"
        return

    yield f"✅ **Raw extraction complete.** Primary vibe detected: **{raw.get('primary_vibe', 'unknown')}**\n\n"
    yield f"🎨 Color palette: {', '.join(raw.get('color_palette', []))}\n\n"
    yield f"🏷️ Style tags: {', '.join(raw.get('style_tags', []))}\n\n"
    yield "---\n\n"
    yield "🧠 **Phase 2:** Agent reasoning — cross-referencing against catalog...\n\n"

    refined = reason_about_vibes(raw)
    if not refined or "error" in refined:
        yield f"⚠️ Reasoning failed, using raw extraction.\n"
        refined = raw

    # Show reasoning
    if "reasoning" in refined:
        yield f"💭 **Agent reasoning:** {refined['reasoning']}\n\n"
    if "secondary_vibe" in refined and refined["secondary_vibe"]:
        yield f"🔀 **Vibe overlap detected:** {refined['primary_vibe']} + {refined['secondary_vibe']}\n\n"
    if "vibe_confidence" in refined:
        conf = refined["vibe_confidence"]
        bar = "█" * int(conf * 10) + "░" * (10 - int(conf * 10))
        yield f"📊 **Confidence:** [{bar}] {conf:.0%}\n\n"

    yield "---\n\n"
    yield "📝 **Final Product Entry:**\n\n"

    # Clean display copy (remove internal fields)
    display = {k: v for k, v in refined.items() if not k.startswith("_")}
    yield f"**{display.get('name', 'Product')}** — *{display.get('primary_vibe', '')}*\n\n"
    yield f"> {display.get('vibe_description', '')}\n\n"
    yield f"```json\n{json.dumps(display, indent=2)}\n```\n"


# --- CLI for quick testing ---
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python vlm_agent.py <image_path>")
        print("  Extracts vibe data from a product image and prints the result.")
        sys.exit(1)

    image_path = sys.argv[1]
    with open(image_path, "rb") as f:
        img_bytes = f.read()

    b64 = base64.b64encode(img_bytes).decode("utf-8")

    # Detect mime type
    ext = os.path.splitext(image_path)[1].lower()
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext.lstrip("."), "image/jpeg")

    print("🔍 Extracting vibe from image...")
    result = ingest_product_image(b64, mime)
    print(json.dumps(result, indent=2))
