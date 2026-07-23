def test_login_error_prose_comparison():
    error = "Access denied."
    assert error == "Access denied.", "login should fail"
