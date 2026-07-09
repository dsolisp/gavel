# Clean: @pytest.mark.skip with a reason and ticket reference.
import pytest


@pytest.mark.skip(reason="PROJ-456 feature not yet implemented")
def test_should_skip_with_reason():
    pass
