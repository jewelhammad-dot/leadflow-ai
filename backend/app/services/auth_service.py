from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


class AuthService:

    @staticmethod
    def hash_password(password: str) -> str:
        password = password[:72]
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        password = password[:72]
        return pwd_context.verify(password, hashed_password)