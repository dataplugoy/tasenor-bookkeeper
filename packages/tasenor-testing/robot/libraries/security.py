import os
import jwt
import sys

def parse_jwt_token(token) -> dict:
    TEST_SECRET = os.getenv('TEST_SECRET')
    if TEST_SECRET is None:
        raise Exception('No environment TEST_SECRET defined.')
    if not token:
        raise Exception('No token given for parse_token().')

    try:
        return jwt.decode(token, TEST_SECRET, algorithms=["HS256"], verify=False, audience=["refresh", "bookkeeping"])
    except Exception as e:
        sys.stderr.write(f"A verification for token {token} failed.\n")
        sys.stderr.write(repr(e))
        raise
