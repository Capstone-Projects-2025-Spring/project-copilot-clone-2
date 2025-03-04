from gotrue import SyncSupportedStorage
from flask import session

class FlaskSessionStorage(SyncSupportedStorage):
   def __init__(self):
       self.storage = session


   def get_item(self, key: str) -> str | None:
       value = self.storage.get(key, None)
       print(f"Session Get: {key} = {value}")
       return value


   def set_item(self, key: str, value: str) -> None:
       print(f"Session Set: {key} = {value}")
       self.storage[key] = value


   def remove_item(self, key: str) -> None:
       if key in self.storage:
           print(f"Session Remove: {key}")
           self.storage.pop(key, None)