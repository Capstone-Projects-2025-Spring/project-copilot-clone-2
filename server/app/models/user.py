import bcrypt

class User:
    id: str
    created_at: str
    first_name: str
    last_name: str
    email: str

    def __init__(self, id: str, created_at: str, first_name: str, last_name: str, email: str):
        self.id = id
        self.created_at = created_at
        self.first_name = first_name
        self.last_name = last_name
        self.email = email

    def get_user(self):
        return self
    
    def to_json(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email
        }

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')