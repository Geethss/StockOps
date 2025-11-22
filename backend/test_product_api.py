"""Test Product API Endpoints"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_create_product():
    """Test creating a product"""
    print("=" * 50)
    print("TEST 1: Creating a Product")
    print("=" * 50)
    
    url = f"{BASE_URL}/products"
    data = {
        "name": "Dell Laptop XPS 15",
        "sku": "LAP-DELL-001",
        "category_id": None,
        "unit_of_measure": "Piece",
        "unit_cost": 1299.99
    }
    
    print(f"\nPOST {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 201:
            product = response.json()
            print(f"\n✅ Product Created Successfully!")
            print(f"\nProduct Details:")
            print(json.dumps(product, indent=2, default=str))
            return product.get('id')
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"\n❌ Connection Error: {str(e)}")
        print("Make sure your backend server is running on http://localhost:8000")
        return None

def test_get_all_products():
    """Test getting all products"""
    print("\n" + "=" * 50)
    print("TEST 2: Getting All Products")
    print("=" * 50)
    
    url = f"{BASE_URL}/products"
    
    print(f"\nGET {url}")
    
    try:
        response = requests.get(url)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            print(f"\n✅ Retrieved {len(products)} product(s)!")
            print(f"\nProducts List:")
            print(json.dumps(products, indent=2, default=str))
            return products
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"\n❌ Connection Error: {str(e)}")
        return None

def test_get_product_by_id(product_id):
    """Test getting a specific product by ID"""
    print("\n" + "=" * 50)
    print("TEST 3: Getting Product by ID")
    print("=" * 50)
    
    if not product_id:
        print("\n⚠️  Skipping - No product ID available")
        return
    
    url = f"{BASE_URL}/products/{product_id}"
    
    print(f"\nGET {url}")
    
    try:
        response = requests.get(url)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            product = response.json()
            print(f"\n✅ Product Retrieved Successfully!")
            print(f"\nProduct Details:")
            print(json.dumps(product, indent=2, default=str))
            return product
        elif response.status_code == 404:
            print(f"\n⚠️  Product not found (ID: {product_id})")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"\n❌ Connection Error: {str(e)}")
        return None

def test_search_products():
    """Test searching products"""
    print("\n" + "=" * 50)
    print("TEST 4: Searching Products")
    print("=" * 50)
    
    search_term = "Laptop"
    url = f"{BASE_URL}/products/search?q={search_term}"
    
    print(f"\nGET {url}")
    
    try:
        response = requests.get(url)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            print(f"\n✅ Found {len(products)} product(s) matching '{search_term}'!")
            print(f"\nSearch Results:")
            print(json.dumps(products, indent=2, default=str))
            return products
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"\n❌ Connection Error: {str(e)}")
        return None

def main():
    print("\n" + "=" * 50)
    print("PRODUCT API TESTING SUITE")
    print("=" * 50)
    print("\nMake sure your backend server is running:")
    print("  cd backend")
    print("  ..\\venv\\Scripts\\Activate.ps1")
    print("  python -m uvicorn app.main:app --reload")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    # Test 1: Create Product
    product_id = test_create_product()
    
    # Test 2: Get All Products
    test_get_all_products()
    
    # Test 3: Get Product by ID
    test_get_product_by_id(product_id)
    
    # Test 4: Search Products
    test_search_products()
    
    print("\n" + "=" * 50)
    print("ALL TESTS COMPLETED!")
    print("=" * 50)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests cancelled by user.")

