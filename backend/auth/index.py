import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication - register and login with email or phone
    Args: event with httpMethod, body (email/phone, password, name)
    Returns: HTTP response with user data and auth token
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                return register_user(conn, body)
            elif action == 'login':
                return login_user(conn, body)
            elif action == 'verify':
                return verify_token(conn, body)
            else:
                return error_response('Invalid action', 400)
        
        return error_response('Method not allowed', 405)
        
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
    finally:
        if 'conn' in locals():
            conn.close()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, pwd_hash = stored_hash.split('$')
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except:
        return False


def generate_token(user_id: int) -> str:
    return secrets.token_urlsafe(32) + f"_{user_id}"


def extract_user_id(token: str) -> Optional[int]:
    try:
        return int(token.split('_')[-1])
    except:
        return None


def register_user(conn, body: Dict[str, Any]) -> Dict[str, Any]:
    email = body.get('email')
    phone = body.get('phone')
    password = body.get('password')
    name = body.get('name', '')
    
    if not password or (not email and not phone):
        return error_response('Email or phone and password required', 400)
    
    if len(password) < 6:
        return error_response('Password must be at least 6 characters', 400)
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Проверка существования пользователя
    if email:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return error_response('User with this email already exists', 409)
    
    if phone:
        cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        if cursor.fetchone():
            return error_response('User with this phone already exists', 409)
    
    # Создание пользователя
    password_hash = hash_password(password)
    cursor.execute(
        """
        INSERT INTO users (email, phone, password_hash, name)
        VALUES (%s, %s, %s, %s)
        RETURNING id, email, phone, name, created_at
        """,
        (email, phone, password_hash, name)
    )
    user = cursor.fetchone()
    conn.commit()
    
    token = generate_token(user['id'])
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'name': user['name']
            }
        })
    }


def login_user(conn, body: Dict[str, Any]) -> Dict[str, Any]:
    email = body.get('email')
    phone = body.get('phone')
    password = body.get('password')
    
    if not password or (not email and not phone):
        return error_response('Email or phone and password required', 400)
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Поиск пользователя
    if email:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    else:
        cursor.execute("SELECT * FROM users WHERE phone = %s", (phone,))
    
    user = cursor.fetchone()
    
    if not user or not verify_password(password, user['password_hash']):
        return error_response('Invalid credentials', 401)
    
    token = generate_token(user['id'])
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'name': user['name']
            }
        })
    }


def verify_token(conn, body: Dict[str, Any]) -> Dict[str, Any]:
    token = body.get('token')
    
    if not token:
        return error_response('Token required', 400)
    
    user_id = extract_user_id(token)
    if not user_id:
        return error_response('Invalid token', 401)
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id, email, phone, name FROM users WHERE id = %s",
        (user_id,)
    )
    user = cursor.fetchone()
    
    if not user:
        return error_response('User not found', 401)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'phone': user['phone'],
                'name': user['name']
            }
        })
    }


def error_response(message: str, status: int) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': False,
            'error': message
        })
    }
