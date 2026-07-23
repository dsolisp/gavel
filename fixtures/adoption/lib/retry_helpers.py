# Remediation helpers. retry_request is adopted by a spec; retry_forever is not.


def retry_request(fn, attempts=3):
    for _ in range(attempts):
        result = fn()
        if result is not None:
            return result
    return None


def retry_forever(fn):
    while True:
        result = fn()
        if result is not None:
            return result
