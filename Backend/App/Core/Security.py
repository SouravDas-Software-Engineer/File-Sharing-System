from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

SECRET_KEY = "AOLvPp]Y_I?0xWg0&NeiYLd-AmLAl6c8>gV/(|YFQl," #jwt key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
