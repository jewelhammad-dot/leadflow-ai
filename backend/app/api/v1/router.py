from fastapi import APIRouter

from app.api.v1.endpoints import lead, auth, qualification, public

router = APIRouter()

router.include_router(lead.router)
router.include_router(auth.router)
router.include_router(qualification.router)
router.include_router(public.router)


@router.get("/health")
def health_check():
    return {"status": "OK"}