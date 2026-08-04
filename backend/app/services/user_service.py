from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.services.auth_service import AuthService


class UserService:

    @staticmethod
    def create_user(db: Session, user: UserCreate):

        print("STEP 1")

        hashed_password = AuthService.hash_password(user.password)

        print("STEP 2")

        new_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            is_active=True,
        )

        print("STEP 3")

        db.add(new_user)

        print("STEP 4")

        db.commit()

        print("STEP 5")

        db.refresh(new_user)

        print("STEP 6")

        return new_user