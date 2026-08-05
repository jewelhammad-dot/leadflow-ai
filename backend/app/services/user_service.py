from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.services.auth_service import AuthService


class UserService:

    @staticmethod
    def create_user(db: Session, user: UserCreate):

        hashed_password = AuthService.hash_password(user.password)

        new_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            is_active=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    @staticmethod
    def get_user_by_email(db: Session, email: str):

        return db.query(User).filter(User.email == email).first()