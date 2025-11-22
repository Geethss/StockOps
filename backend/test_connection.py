"""Test database connection to Neon PostgreSQL"""
import sys
from sqlalchemy import text
from app.core.database import engine
from app.core.config import settings

def test_connection():
    print("=" * 50)
    print("Testing Database Connection")
    print("=" * 50)
    
    print(f"\n📋 Configuration:")
    print(f"   DATABASE_URL: {settings.DATABASE_URL[:50]}..." if len(settings.DATABASE_URL) > 50 else f"   DATABASE_URL: {settings.DATABASE_URL}")
    
    try:
        print("\n🔌 Attempting to connect...")
        with engine.connect() as conn:
            # Test query - wrap SQL with text() for SQLAlchemy 2.0
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print("✅ Successfully connected to database!")
            print(f"\n📊 Database Info:")
            print(f"   Version: {version}")
            
            # Check if tables exist - wrap SQL with text()
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            if tables:
                print(f"\n📋 Existing tables ({len(tables)}):")
                for table in tables:
                    print(f"   - {table}")
            else:
                print("\n⚠️  No tables found. Run migrations first:")
                print("   alembic upgrade head")
                
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"   Error: {str(e)}")
        print(f"\n💡 Troubleshooting:")
        print(f"   1. Check if .env file exists in backend/ folder")
        print(f"   2. Verify DATABASE_URL in .env file")
        print(f"   3. Ensure Neon PostgreSQL database is running")
        print(f"   4. Check if connection string includes ?sslmode=require")
        print(f"   5. Verify your Neon connection string is correct")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)

