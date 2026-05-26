import os
import json
import sqlite3
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Use the provided Subconscious API Key
API_KEY = "sky_DuHWYcES.j7Ge2XITqc89IbsYBPRKMNoOZpJano02"
# Defaulting to an OpenAI-compatible endpoint, assuming openrouter if slash is present, or subconcious
# Note: we'll try to just pass it; if the user's environment is set up for it, they might have OPENAI_BASE_URL set.
BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://api.subconscious.dev/v1")

try:
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
except Exception:
    client = OpenAI(api_key=API_KEY)

def execute_local_sqlite_query(sql_query):
    conn = None
    try:
        conn = sqlite3.connect('wayfair_catalog.db', timeout=10)
        
        if "SELECT" not in sql_query.upper():
            return "Error: Only SELECT queries are permitted."
            
        df = pd.read_sql_query(sql_query, conn)
        
        # Return dataframe or string if empty
        if df.empty:
            return "0 rows returned."
            
        return df
    except Exception as e:
        return f"SQL Syntax or Database Error: {e}"
    finally:
        if conn:
            conn.close()

def parse_and_execute(llm_response):
    try:
        _start = llm_response.find('{')
        _end = llm_response.rfind('}')
        if _start != -1 and _end > _start:
            clean_json_string = llm_response[_start:_end + 1]
        else:
            clean_json_string = llm_response
            
        decision = json.loads(clean_json_string)
        tool = decision.get("tool") or decision.get("name")
        args = decision.get("args") or decision.get("parameters", {})
        
        if tool == "query_local_data":
            query = args.get("sql_query", args.get("query", ""))
            return tool, execute_local_sqlite_query(query)
        elif tool == "direct_response":
            return tool, args.get("text", "I'm not sure how to respond to that.")
        else:
            return "error", f"Unknown tool: {tool}"
            
    except json.JSONDecodeError:
        return "error", f"Error: Invalid JSON. Raw output: {llm_response}"

def ask_agent(user_input, chat_history=None):
    """
    Returns (agent_message, products_df, fallback_triggered).
    If products_df is a DataFrame, the UI renders the grid.
    If it's an error/empty, we handle the fallback.
    """
    system_prompt = """You are the Wayfair Aesthetic Matchmaker, an elite interior design AI.
The user will give you a "vibe", "aesthetic", or a messy description of their dream room.
Your job is to translate their emotional description into 3-5 concrete search keywords that exist in our furniture catalog (e.g., 'velvet', 'industrial', 'walnut', 'boho', 'matte black').

You have access to the 'query_local_data' tool. 
Write a SQLite query using the keywords to search the 'aesthetic_description' column of the 'products' table using LIKE clauses.
Example: SELECT * FROM products WHERE aesthetic_description LIKE '%velvet%' OR aesthetic_description LIKE '%dark wood%' LIMIT 9;

OUTPUT FORMAT:
You MUST output ONLY a valid JSON object.
{
    "thought": "Your reasoning process.",
    "tool": "query_local_data",
    "args": {"sql_query": "SELECT * FROM products ..."}
}"""

    messages = [{"role": "system", "content": system_prompt}]
    if chat_history:
        messages.extend(chat_history[-4:])
    messages.append({"role": "user", "content": user_input})

    # Phase 1: Initial attempt
    try:
        response = client.chat.completions.create(
            model="subconscious/tim-qwen3.6-27b",
            messages=messages,
            temperature=0.3,
            extra_body={"chat_template_kwargs": {"enable_thinking": False}}
        )
        raw_decision = response.choices[0].message.content
        tool_name, tool_result = parse_and_execute(raw_decision)
    except Exception as e:
        return f"API Error: {e}", None, False

    # The Killer Feature: Agentic Loop for Empty Results
    if isinstance(tool_result, str) and ("0 rows returned" in tool_result or "Error" in tool_result):
        # Trigger Fallback
        fallback_msg = "I couldn't find exact matches for that specific aesthetic, but I found some pieces that fit the general vibe perfectly!"
        
        fallback_prompt = (
            f"The query failed or returned 0 rows. Original input was: '{user_input}'. "
            "Broaden your search significantly. Use simpler, generic keywords like 'wood', 'metal', 'white', 'black', 'retro', or 'modern'. "
            "Write a new SQL query."
        )
        messages.append({"role": "assistant", "content": raw_decision})
        messages.append({"role": "user", "content": fallback_prompt})
        
        try:
            fallback_response = client.chat.completions.create(
                model="subconscious/tim-qwen3.6-27b",
                messages=messages,
                temperature=0.5,
                extra_body={"chat_template_kwargs": {"enable_thinking": False}}
            )
            raw_decision2 = fallback_response.choices[0].message.content
            tool_name2, tool_result2 = parse_and_execute(raw_decision2)
            
            if isinstance(tool_result2, pd.DataFrame) and not tool_result2.empty:
                return fallback_msg, tool_result2, True
            else:
                return "Even with a broader search, I couldn't find any items matching that vibe.", None, True
        except Exception as e:
            return f"Fallback API Error: {e}", None, True

    elif isinstance(tool_result, pd.DataFrame) and not tool_result.empty:
        return "Here are the perfect pieces for your aesthetic!", tool_result, False
    
    return "I couldn't process your request.", None, False