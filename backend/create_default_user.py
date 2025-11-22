
from app.core.database import SessionLocal
from app.models.user import User
import uuid

def ensure_default_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            print("Creating default user...")
            user = User(
                id=str(uuid.uuid4()),
                email="admin@example.com", 
                full_name="System Admin", 
                hashed_password="dummy_hash_for_testing" # We don't need a real hash since auth is disabled
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        print(f"Default user ID: {user.id}")
        return user.id
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    ensure_default_user()

