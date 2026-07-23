# Consumes the request helper and the session fixture; the forever helper and orphan fixture stay unadopted.
from lib.retry_helpers import retry_request


def test_retries_until_success(db_session):
    result = retry_request(lambda: db_session)
    assert result["open"] is True
