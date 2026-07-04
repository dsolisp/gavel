import pytest


class TestLogin:
    @pytest.mark.regression
    def test_valid_login(self):
        assert True

    @pytest.mark.smoke
    def test_invalid_login(self):
        assert True
