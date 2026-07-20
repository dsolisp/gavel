import time


def test_busy_wait_loop():
    while True:
        check_status()
        time.sleep(0.5)
