# VIOLATION: skip-marker — @pytest.mark.skip without reason or ticket.
import pytest


@pytest.mark.skip
def test_should_skip_without_reason():
    pass
