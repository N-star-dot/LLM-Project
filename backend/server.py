from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import agent

app = FastAPI(title="Wayfair Aesthetic Matchmaker API")

# Allow all origins for local dev — Expo Go needs this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str
    chat_history: list[dict] | None = None

class Product(BaseModel):
    id: int
    name: str
    category: str
    price: float
    width_in: float | None = None
    height_in: float | None = None
    depth_in: float | None = None
    primary_vibe: str | None = None
    color_palette: str | None = None
    style_tags: str | None = None
    vibe_description: str | None = None
    image_url: str | None = None


class SearchResponse(BaseModel):
    message: str
    products: list[Product] | None = None
    fallback: bool = False


@app.post("/search", response_model=SearchResponse)
def search(req: SearchRequest):
    message, products, fallback = agent.ask_agent(req.query, chat_history=req.chat_history)
    return SearchResponse(
        message=message,
        products=products,
        fallback=fallback,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
