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


class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    image_url: str
    aesthetic_description: str


class SearchResponse(BaseModel):
    message: str
    products: list[Product] | None = None
    fallback: bool = False


@app.post("/search", response_model=SearchResponse)
def search(req: SearchRequest):
    message, products, fallback = agent.ask_agent(req.query)
    return SearchResponse(
        message=message,
        products=products,
        fallback=fallback,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
