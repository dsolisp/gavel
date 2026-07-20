import time


def test_polling_loop_wait():
    ready = False
    while not ready:
        time.sleep(1)
