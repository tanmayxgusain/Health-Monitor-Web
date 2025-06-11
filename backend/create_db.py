# create_db.py
from database import Base, engine
from models import User  # or whatever your model file is

Base.metadata.create_all(bind=engine)
print("Database tables created.")
