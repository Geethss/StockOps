"""View all tables and data in Neon PostgreSQL database"""
import sys
from sqlalchemy import text
from app.core.database import engine

def view_tables():
    print("=" * 50)
    print("Viewing All Tables in Database")
    print("=" * 50)
    
    try:
        with engine.connect() as conn:
            # List all tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            print(f"\n[INFO] Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table}")
            
            # Show data from each table
            for table in tables:
                print(f"\n{'='*50}")
                print(f"Table: {table}")
                print(f"{'='*50}")
                
                try:
                    # Get row count
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
                    count = count_result.scalar()
                    print(f"Row count: {count}")
                    
                    if count > 0:
                        # Get column names
                        cols_result = conn.execute(text(f"""
                            SELECT column_name 
                            FROM information_schema.columns 
                            WHERE table_name = '{table}'
                            ORDER BY ordinal_position;
                        """))
                        columns = [row[0] for row in cols_result]
                        
                        # Get first 5 rows
                        data_result = conn.execute(text(f"SELECT * FROM {table} LIMIT 5;"))
                        rows = data_result.fetchall()
                        
                        print(f"\nColumns: {', '.join(columns)}")
                        print(f"\nFirst {len(rows)} rows:")
                        for idx, row in enumerate(rows, 1):
                            print(f"\n  Row {idx}:")
                            for col, val in zip(columns, row):
                                print(f"    {col}: {val}")
                    else:
                        print("  (No data)")
                except Exception as e:
                    print(f"  [ERROR] Could not read table: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error viewing tables!")
        print(f"   Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = view_tables()
    sys.exit(0 if success else 1)

