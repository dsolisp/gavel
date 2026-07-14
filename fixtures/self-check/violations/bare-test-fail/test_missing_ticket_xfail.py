# VIOLATION: bare-test-fail — @pytest.mark.xfail without ticket reference.
import pytest


@pytest.mark.xfail
def test_expected_failure_without_ticket():
    assert False
