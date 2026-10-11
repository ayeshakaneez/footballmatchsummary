"""Run pristine upstream code against a copy of the original database schema."""
from pathlib import Path
from functools import wraps
import os
import secrets
import sys

os.environ.setdefault('FOOTY_SQL_DATABASE', 'FootyJugaadLegacyDB')
if os.environ['FOOTY_SQL_DATABASE'].casefold() == 'footballdb':
    raise RuntimeError('Use a separate database copy; FootballDB belongs to the original backend.')

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend_jugaad'))

import bcrypt
from fastapi import HTTPException
from sqlalchemy import func, inspect, select
from backend.database import engine
from backend import models

schema = inspect(engine)
user_columns = {column['name'] for column in schema.get_columns('users')}
if 'password' in user_columns and 'password_hash' not in user_columns:
    # Preserve the Python attribute expected by upstream; use the original SQL name.
    models.User.__table__.c.password_hash.name = 'password'

from backend.routers import processing, users

original_login = users.login


@wraps(original_login)
def compatible_login(payload, request, db):
    user = db.scalar(select(models.User).where(
        func.lower(models.User.email) == payload.email.lower().strip()
    ))
    if user and not user.password_hash.startswith(('$2a$', '$2b$', '$2y$')):
        # The original SQL database contains plaintext credentials. Upgrade in
        # the separate copy only after the supplied password matches exactly.
        if not secrets.compare_digest(payload.password.encode('utf-8'), user.password_hash.encode('utf-8')):
            raise HTTPException(status_code=401, detail='Invalid email or password.')
        user.password_hash = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode()
        db.flush()
    try:
        return original_login(payload, request, db)
    except ValueError:
        # Invalid legacy salts or unsupported password lengths reject the login.
        raise HTTPException(status_code=401, detail='Invalid email or password.') from None


for route in users.router.routes:
    if route.endpoint is original_login:
        route.endpoint = compatible_login
        route.dependant.call = compatible_login

player_columns = {column['name']: column for column in schema.get_columns('players')}
if not player_columns['name']['nullable']:
    # The old database disallows unnamed slots. Unknown numbers remain unnamed
    # in the event occurrence instead of causing a NOT NULL insert failure.
    original_roster_player = processing._roster_player

    def existing_roster_player(db, team, jersey_number, create_slot=True):
        return original_roster_player(db, team, jersey_number, create_slot=False)

    processing._roster_player = existing_roster_player

from backend.app import app
