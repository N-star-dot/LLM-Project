"""
VLM Vibe Agent — Autonomous Pinterest Pipeline
================================================
This is the AGENT, not just the brain.

It autonomously:
1. Crawls a product image source (folder or URL list)
2. Decides which products need vibe extraction
3. Runs the VLM pipeline on each one
4. Reasons about overlaps, confidence, edge cases
5. Skips, retries, or flags products based on judgment
6. Saves all results to the catalog

No human in the loop. The agent does the work.
"""

import os
import json
import base64
import time
import glob
import vlm_agent


# --- Agent State ---
class AgentState:
    """Tracks the agent's work across the pipeline run."""
    def __init__(self):
        self.processed = []
        self.skipped = []
        self.failed = []
        self.retried = []
        self.total_images = 0
        self.current_index = 0
        self.catalog_before = len(vlm_agent.load_catalog())

    def summary(self):
        return {
            "total_images": self.total_images,
            "processed": len(self.processed),
            "skipped": len(self.skipped),
            "failed": len(self.failed),
            "retried": len(self.retried),
            "catalog_before": self.catalog_before,
            "catalog_after": len(vlm_agent.load_catalog()),
            "new_products_added": len(vlm_agent.load_catalog()) - self.catalog_before,
        }


# --- Agent Decision Logic ---
def should_skip_image(filepath, state):
    """Agent decides whether to skip an image based on file properties."""
    # Skip if too small (likely a thumbnail or icon)
    size = os.path.getsize(filepath)
    if size < 5000:  # < 5KB
        return True, "Image too small — likely a thumbnail or icon, not a product photo."

    # Skip if too large (would blow up the API)
    if size > 15 * 1024 * 1024:  # > 15MB
        return True, "Image too large — exceeds 15MB API limit."

    return False, None


def should_retry(result, attempt):
    """Agent decides whether to retry a failed extraction."""
    if not result:
        return attempt < 2, "Empty result — retrying with fresh API call."

    if isinstance(result, dict) and "error" in result:
        error_msg = result["error"]
        # Rate limit — wait and retry
        if "rate limit" in error_msg.lower():
            return attempt < 3, f"Rate limited — will wait and retry (attempt {attempt + 1}/3)."
        # Connection error — retry once
        if "connect" in error_msg.lower():
            return attempt < 2, "Connection error — retrying."
        # Other errors — don't retry
        return False, f"Unrecoverable error: {error_msg}"

    return False, None


def assess_extraction_quality(result):
    """
    Agent judges whether an extraction is good enough to save.
    This is the REASONING part — not just pass/fail.
    """
    if not result or "error" in result:
        return False, "Extraction failed entirely."

    issues = []

    # Check vibe confidence
    confidence = result.get("vibe_confidence", 0.5)
    if confidence < 0.3:
        issues.append(f"Very low confidence ({confidence:.0%}) — vibe assignment unreliable.")

    # Check if essential fields exist and aren't empty
    if not result.get("vibe_description", "").strip():
        issues.append("Missing vibe description — core output is empty.")

    if len(result.get("style_tags", [])) < 3:
        issues.append(f"Only {len(result.get('style_tags', []))} style tags — need at least 3 for meaningful search.")

    if len(result.get("color_palette", [])) < 2:
        issues.append(f"Only {len(result.get('color_palette', []))} colors — palette too sparse.")

    if not result.get("primary_vibe"):
        issues.append("No primary vibe assigned.")

    # Agent decision: if more than 2 critical issues, reject
    if len(issues) >= 2:
        return False, f"Quality check failed ({len(issues)} issues): " + "; ".join(issues)

    return True, "Quality check passed." + (f" Minor note: {issues[0]}" if issues else "")


# --- The Agent Loop ---
def run_agent_on_folder(folder_path, callback=None):
    """
    The autonomous agent. Point it at a folder of product images
    and it processes everything — no human needed.

    Args:
        folder_path: Path to folder containing product images
        callback: Optional function(event_type, data) for live updates

    Returns:
        AgentState with full run summary
    """
    state = AgentState()

    def emit(event_type, data):
        if callback:
            callback(event_type, data)

    # 1. CRAWL — Discover all images in the folder
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(os.path.join(folder_path, ext)))
        image_files.extend(glob.glob(os.path.join(folder_path, "**", ext), recursive=True))

    # Deduplicate and sort
    image_files = sorted(set(image_files))
    state.total_images = len(image_files)

    emit("discovery", {
        "total_images": len(image_files),
        "folder": folder_path,
        "files": [os.path.basename(f) for f in image_files]
    })

    if not image_files:
        emit("error", {"message": f"No images found in {folder_path}"})
        return state

    # 2. PROCESS — Loop through each image autonomously
    catalog = vlm_agent.load_catalog()
    next_id = max((item.get("id", 0) for item in catalog), default=0) + 1

    for i, filepath in enumerate(image_files):
        state.current_index = i + 1
        filename = os.path.basename(filepath)

        emit("processing", {
            "index": i + 1,
            "total": len(image_files),
            "filename": filename,
            "phase": "evaluating"
        })

        # AGENT DECISION: Should I skip this image?
        skip, skip_reason = should_skip_image(filepath, state)
        if skip:
            state.skipped.append({"file": filename, "reason": skip_reason})
            emit("skipped", {"filename": filename, "reason": skip_reason})
            continue

        # Read and encode image
        try:
            with open(filepath, "rb") as f:
                img_bytes = f.read()
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        except Exception as e:
            state.failed.append({"file": filename, "error": f"Could not read file: {e}"})
            emit("failed", {"filename": filename, "error": str(e)})
            continue

        # Detect mime type
        ext = os.path.splitext(filepath)[1].lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")

        # PHASE 1: VLM Extraction (with retry logic)
        result = None
        attempt = 0
        while attempt < 3:
            emit("processing", {
                "index": i + 1,
                "total": len(image_files),
                "filename": filename,
                "phase": "vlm_extraction",
                "attempt": attempt + 1
            })

            result = vlm_agent.extract_raw_vibe(img_b64, mime)

            if result and "error" not in result:
                break  # Success

            # AGENT DECISION: Should I retry?
            retry, retry_reason = should_retry(result, attempt)
            if retry:
                state.retried.append({"file": filename, "attempt": attempt + 1, "reason": retry_reason})
                emit("retry", {"filename": filename, "attempt": attempt + 1, "reason": retry_reason})
                # Rate limit backoff
                if result and "rate limit" in str(result.get("error", "")).lower():
                    time.sleep(5 * (attempt + 1))  # Progressive backoff
                else:
                    time.sleep(1)
                attempt += 1
            else:
                break

        if not result or "error" in result:
            state.failed.append({"file": filename, "error": str(result)})
            emit("failed", {"filename": filename, "error": str(result)})
            continue

        # PHASE 2: Agentic Reasoning
        emit("processing", {
            "index": i + 1,
            "total": len(image_files),
            "filename": filename,
            "phase": "reasoning"
        })

        refined = vlm_agent.reason_about_vibes(result, catalog)
        if not refined:
            refined = result  # Graceful fallback

        # AGENT DECISION: Is this extraction good enough to save?
        quality_ok, quality_note = assess_extraction_quality(refined)

        if not quality_ok:
            state.failed.append({"file": filename, "error": quality_note})
            emit("quality_rejected", {"filename": filename, "reason": quality_note})
            continue

        # Assign ID and save
        refined["id"] = next_id
        refined["_source_file"] = filename
        next_id += 1

        # Ensure required fields
        for field, default in {"name": "Unnamed", "category": "furniture", "price": 0,
                                "width_in": 0, "height_in": 0, "depth_in": 0,
                                "primary_vibe": "unknown", "color_palette": [],
                                "style_tags": [], "vibe_description": ""}.items():
            if field not in refined:
                refined[field] = default

        catalog.append(refined)
        state.processed.append({
            "file": filename,
            "product": refined,
            "quality_note": quality_note
        })

        emit("extracted", {
            "filename": filename,
            "product": refined,
            "quality_note": quality_note
        })

        # Brief pause to respect API rate limits
        time.sleep(0.5)

    # 3. SAVE — Write the updated catalog
    try:
        with open(vlm_agent.CATALOG_PATH, "w") as f:
            json.dump(catalog, f, indent=4)
        emit("saved", {"total_new": len(state.processed), "catalog_size": len(catalog)})
    except Exception as e:
        emit("error", {"message": f"Failed to save catalog: {e}"})

    # 4. REPORT — Agent summarizes its own work
    emit("complete", state.summary())

    return state


# --- Streaming version for Streamlit ---
def stream_agent_run(folder_path):
    """
    Generator that yields markdown updates as the agent works.
    Drop-in for st.write_stream().
    """
    events = []

    def collect_event(event_type, data):
        events.append((event_type, data))

    # We can't truly stream a callback-based system through a generator
    # So we run the agent and then replay the events
    # For a LIVE demo, we use the Streamlit version below instead

    yield "## 🤖 Autonomous Vibe Agent\n\n"
    yield f"📂 Scanning folder: `{folder_path}`\n\n"

    # Discover images first
    extensions = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(os.path.join(folder_path, ext)))
        image_files.extend(glob.glob(os.path.join(folder_path, "**", ext), recursive=True))
    image_files = sorted(set(image_files))

    if not image_files:
        yield "❌ **No images found.** Drop product photos into the folder and try again.\n"
        return

    yield f"🔍 **Discovered {len(image_files)} product images.** Starting autonomous extraction...\n\n"
    yield "---\n\n"

    catalog = vlm_agent.load_catalog()
    next_id = max((item.get("id", 0) for item in catalog), default=0) + 1
    processed = []
    failed = []
    skipped = []

    for i, filepath in enumerate(image_files):
        filename = os.path.basename(filepath)
        yield f"### [{i+1}/{len(image_files)}] `{filename}`\n\n"

        # Skip check
        skip, skip_reason = should_skip_image(filepath, None)
        if skip:
            skipped.append(filename)
            yield f"⏭️ **Skipped** — {skip_reason}\n\n"
            continue

        # Read image
        try:
            with open(filepath, "rb") as f:
                img_bytes = f.read()
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        except Exception as e:
            failed.append(filename)
            yield f"❌ **Failed to read** — {e}\n\n"
            continue

        ext = os.path.splitext(filepath)[1].lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")

        # Phase 1: VLM
        yield "🔍 Phase 1: VLM extraction...\n\n"
        result = None
        for attempt in range(3):
            result = vlm_agent.extract_raw_vibe(img_b64, mime)
            if result and "error" not in result:
                break
            retry, reason = should_retry(result, attempt)
            if retry:
                yield f"🔄 Retry {attempt+1}: {reason}\n\n"
                if result and "rate limit" in str(result.get("error", "")).lower():
                    time.sleep(5 * (attempt + 1))
                else:
                    time.sleep(1)
            else:
                break

        if not result or "error" in result:
            failed.append(filename)
            yield f"❌ **Extraction failed** — {result}\n\n"
            continue

        yield f"✅ Raw vibe: **{result.get('primary_vibe', '?')}** | Tags: {', '.join(result.get('style_tags', [])[:5])}...\n\n"

        # Phase 2: Reasoning
        yield "🧠 Phase 2: Agent reasoning...\n\n"
        refined = vlm_agent.reason_about_vibes(result, catalog)
        if not refined:
            refined = result

        # Quality check
        quality_ok, quality_note = assess_extraction_quality(refined)
        if not quality_ok:
            failed.append(filename)
            yield f"🚫 **Quality rejected** — {quality_note}\n\n"
            continue

        # Save
        refined["id"] = next_id
        refined["_source_file"] = filename
        next_id += 1

        for field, default in {"name": "Unnamed", "category": "furniture", "price": 0,
                                "width_in": 0, "height_in": 0, "depth_in": 0,
                                "primary_vibe": "unknown", "color_palette": [],
                                "style_tags": [], "vibe_description": ""}.items():
            if field not in refined:
                refined[field] = default

        catalog.append(refined)
        processed.append(refined)

        # Show result
        conf = refined.get("vibe_confidence", 0.5)
        bar = "█" * int(conf * 10) + "░" * (10 - int(conf * 10))

        yield f"✅ **{refined.get('name')}** — *{refined.get('primary_vibe')}*\n\n"
        if refined.get("secondary_vibe"):
            yield f"🔀 Overlap: {refined.get('secondary_vibe')}\n\n"
        if refined.get("reasoning"):
            yield f"💭 {refined.get('reasoning')}\n\n"
        yield f"📊 Confidence: [{bar}] {conf:.0%}\n\n"
        yield f"> {refined.get('vibe_description', '')}\n\n"
        yield "---\n\n"

        time.sleep(0.5)  # Rate limit respect

    # Save catalog
    try:
        with open(vlm_agent.CATALOG_PATH, "w") as f:
            json.dump(catalog, f, indent=4)
    except Exception as e:
        yield f"⚠️ Failed to save catalog: {e}\n\n"

    # Final report
    yield "## 📋 Agent Run Summary\n\n"
    yield f"| Metric | Count |\n|---|---|\n"
    yield f"| Images discovered | {len(image_files)} |\n"
    yield f"| Successfully processed | {len(processed)} |\n"
    yield f"| Skipped | {len(skipped)} |\n"
    yield f"| Failed / Rejected | {len(failed)} |\n"
    yield f"| Catalog size (before) | {len(catalog) - len(processed)} |\n"
    yield f"| Catalog size (after) | {len(catalog)} |\n\n"

    if processed:
        yield "### New Products Added\n\n"
        for p in processed:
            yield f"- **{p.get('name')}** — {p.get('primary_vibe')} ({p.get('vibe_confidence', 0):.0%} confidence)\n"
        yield "\n"

    yield "✅ **Agent run complete.** All products saved to `mockdata.json`.\n"
