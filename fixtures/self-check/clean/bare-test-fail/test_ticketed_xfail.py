# Clean: pytest expected-failure marker with a ticket reference.
import pytest


@pytest.mark.xfail(reason="PROJ-789 known rounding issue")
def test_expected_failure_with_ticket():
    assert False
