"""Factory: external test data. No hardcoded credentials in test bodies."""
from dataclasses import dataclass, field, replace
from time import time


@dataclass(frozen=True)
class User:
    email: str
    password: str
    role: str = "trader"


class UserFactory:
    @staticmethod
    def create(role: str = "trader") -> User:
        stamp = f"{int(time() * 1000):x}"
        return User(
            email=f"user-{stamp}@example.test",
            password=f"pw-{stamp}",
            role=role,
        )
