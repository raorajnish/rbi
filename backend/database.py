import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

client = None
db = None

async def connect_to_mongo():
    global client, db
    ca = certifi.where()
    client = AsyncIOMotorClient(settings.MONGODB_URL, tlsCAFile=ca)
    db = client.rbi_db
    # Test connection
    try:
        await db.command("ping")
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("✓ MongoDB connection closed")

def get_database() -> AsyncIOMotorDatabase:
    return db
