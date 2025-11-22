# Testing Product API with cURL Commands

## Prerequisites
Make sure your backend server is running:
```bash
cd backend
..\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

## 1. Create a Product

```bash
curl -X POST "http://localhost:8000/api/v1/products" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Gaming Mouse\",
    \"sku\": \"MOUSE-GAMING-001\",
    \"category_id\": null,
    \"unit_of_measure\": \"Piece\",
    \"unit_cost\": 49.99
  }"
```

**Expected Response:**
```json
{
  "id": "abc-123-def-456",
  "name": "Gaming Mouse",
  "sku": "MOUSE-GAMING-001",
  "category_id": null,
  "unit_of_measure": "Piece",
  "unit_cost": 49.99,
  "created_at": "2025-11-22T...",
  "updated_at": "2025-11-22T..."
}
```

**Save the `id` from the response!**

## 2. Get All Products

```bash
curl -X GET "http://localhost:8000/api/v1/products"
```

**With query parameters:**
```bash
# Search by name/SKU
curl -X GET "http://localhost:8000/api/v1/products?search=laptop"

# Pagination
curl -X GET "http://localhost:8000/api/v1/products?skip=0&limit=10"
```

## 3. Get Product by ID

Replace `{product_id}` with the ID from step 1:

```bash
curl -X GET "http://localhost:8000/api/v1/products/{product_id}"
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/products/abc-123-def-456"
```

## 4. Update a Product

```bash
curl -X PUT "http://localhost:8000/api/v1/products/{product_id}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Gaming Mouse Pro\",
    \"unit_cost\": 59.99
  }"
```

## 5. Search Products

```bash
curl -X GET "http://localhost:8000/api/v1/products/search?q=mouse"
```

## Windows PowerShell Alternative

If cURL doesn't work in PowerShell, use `Invoke-WebRequest`:

### Create Product:
```powershell
$body = @{
    name = "Gaming Mouse"
    sku = "MOUSE-GAMING-001"
    category_id = $null
    unit_of_measure = "Piece"
    unit_cost = 49.99
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/products" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Get All Products:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/products" `
  -Method GET | Select-Object -ExpandProperty Content
```

