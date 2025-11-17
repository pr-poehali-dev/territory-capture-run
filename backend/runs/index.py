import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save and retrieve user run history
    Args: event with httpMethod, headers (X-Auth-Token), body (run data)
    Returns: HTTP response with saved/retrieved runs
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
    
    headers = event.get('headers', {})
    token = headers.get('x-auth-token') or headers.get('X-Auth-Token')
    
    if not token:
        return error_response('Authentication required', 401)
    
    user_id = extract_user_id(token)
    if not user_id:
        return error_response('Invalid token', 401)
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        
        if method == 'POST':
            return save_run(conn, user_id, event)
        elif method == 'GET':
            return get_runs(conn, user_id)
        
        return error_response('Method not allowed', 405)
        
    except Exception as e:
        return error_response(f'Server error: {str(e)}', 500)
    finally:
        if 'conn' in locals():
            conn.close()


def extract_user_id(token: str) -> Optional[int]:
    try:
        return int(token.split('_')[-1])
    except:
        return None


def save_run(conn, user_id: int, event: Dict[str, Any]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Проверка существования пользователя
    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    if not cursor.fetchone():
        return error_response('User not found', 404)
    
    cursor.execute(
        """
        INSERT INTO runs (
            user_id, territory, distance, time, avg_speed, avg_pace, 
            max_speed, calories, avg_heart_rate, heart_rate_zone1,
            heart_rate_zone2, heart_rate_zone3, heart_rate_zone4,
            heart_rate_zone5, positions
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, date
        """,
        (
            user_id,
            body.get('territory', ''),
            body.get('distance', 0),
            body.get('time', 0),
            body.get('avgSpeed'),
            body.get('avgPace'),
            body.get('maxSpeed'),
            body.get('calories'),
            body.get('avgHeartRate'),
            body.get('heartRateZones', {}).get('zone1'),
            body.get('heartRateZones', {}).get('zone2'),
            body.get('heartRateZones', {}).get('zone3'),
            body.get('heartRateZones', {}).get('zone4'),
            body.get('heartRateZones', {}).get('zone5'),
            json.dumps(body.get('positions', []))
        )
    )
    
    result = cursor.fetchone()
    conn.commit()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'runId': result['id'],
            'date': result['date'].isoformat()
        })
    }


def get_runs(conn, user_id: int) -> Dict[str, Any]:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute(
        """
        SELECT 
            id, date, territory, distance, time, avg_speed, avg_pace,
            max_speed, calories, avg_heart_rate, heart_rate_zone1,
            heart_rate_zone2, heart_rate_zone3, heart_rate_zone4,
            heart_rate_zone5, positions
        FROM runs
        WHERE user_id = %s
        ORDER BY date DESC
        LIMIT 50
        """,
        (user_id,)
    )
    
    runs = cursor.fetchall()
    
    runs_list = []
    for run in runs:
        runs_list.append({
            'id': str(run['id']),
            'date': run['date'].isoformat(),
            'territory': run['territory'],
            'distance': float(run['distance']) if run['distance'] else 0,
            'time': run['time'],
            'avgSpeed': float(run['avg_speed']) if run['avg_speed'] else 0,
            'avgPace': float(run['avg_pace']) if run['avg_pace'] else 0,
            'maxSpeed': float(run['max_speed']) if run['max_speed'] else 0,
            'calories': run['calories'],
            'avgHeartRate': run['avg_heart_rate'],
            'heartRateZones': {
                'zone1': run['heart_rate_zone1'],
                'zone2': run['heart_rate_zone2'],
                'zone3': run['heart_rate_zone3'],
                'zone4': run['heart_rate_zone4'],
                'zone5': run['heart_rate_zone5']
            } if run['heart_rate_zone1'] is not None else None,
            'positions': run['positions'] if run['positions'] else []
        })
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'runs': runs_list
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
