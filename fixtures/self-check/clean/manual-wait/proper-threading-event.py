import threading


def test_wait_with_signaled_event():
    # Signal-driven: the Event is .set() by the code that flips readiness.
    # An unset Event + wait(timeout=N) would be a sleep rename and is NOT clean.
    ready = threading.Event()
    ready.set()
    assert ready.wait(timeout=2)
