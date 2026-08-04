from sqlalchemy.exc import SQLAlchemyError

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print("=== STARTING DATABASE ===")
        Base.metadata.create_all(bind=engine)
        print("=== DATABASE OK ===")
    except Exception as e:
        print("=== DATABASE ERROR ===")
        import traceback
        traceback.print_exc()
        raise
    yield