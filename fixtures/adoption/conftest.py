# pytest fixtures. db_session is consumed by a spec; orphan_fixture is not.
import pytest


@pytest.fixture
def db_session():
    session = {"open": True}
    yield session
    session["open"] = False


@pytest.fixture
def orphan_fixture():
    return {"unused": True}
