# Testing Product API Endpoints

## Option 1: Using FastAPI Swagger UI (Easiest!)

1. **Start your backend server:**
   ```bash
   cd backend
   ..\venv\Scripts\Activate.ps1
   python -m uvicorn app.main:app --reload
   ```

2. **Open Swagger UI:**
   - Go to: http://localhost:8000/api/docs
   - You'll see all available endpoints

3. **Create a Product:**
   - Find `POST /api/v1/products`
   - Click "Try it out"
   - Enter product data:
   ```json
   {
     "name": "Laptop Computer",
     "sku": "LAP-001",
     "category_id": null,
     "unit_of_measure": "Piece",
     "unit_cost": 999.99
   }
   ```
   - Click "Execute"
   - Copy the `id` from the response

4. **Get All Products:**
   - Find `GET /api/v1/products`
   - Click "Try it out"
   - Click "Execute"
   - See all products

5. **Get Specific Product:**
   - Find `GET /api/v1/products/{product_id}`
   - Click "Try it out"
   - Paste the `id` from step 3
   - Click "Execute"
   - See the product details

