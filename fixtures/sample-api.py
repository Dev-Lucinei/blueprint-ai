from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncpg

app = FastAPI(title="Sample API")

class Product(BaseModel):
    id: int
    name: str
    price: float
    category: str

class CreateProduct(BaseModel):
    name: str
    price: float
    category: str

products_db: List[Product] = []
next_id = 1

@app.get("/api/products", response_model=List[Product])
async def list_products(category: Optional[str] = None):
    if category:
        return [p for p in products_db if p.category == category]
    return products_db

@app.post("/api/products", response_model=Product, status_code=201)
async def create_product(product: CreateProduct):
    global next_id
    new_product = Product(
        id=next_id,
        name=product.name,
        price=product.price,
        category=product.category,
    )
    products_db.append(new_product)
    next_id += 1
    return new_product

@app.get("/api/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    for p in products_db:
        if p.id == product_id:
            return p
    raise HTTPException(status_code=404, detail="Product not found")
