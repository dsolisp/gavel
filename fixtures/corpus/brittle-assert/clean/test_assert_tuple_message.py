def test_assert_tuple_footgun():
    status = 404
    assert (status == 404, "Status should be Not Found.")
