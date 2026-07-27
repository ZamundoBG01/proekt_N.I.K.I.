import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL", "")

def get_db_connection():
    if not DATABASE_URL:
        return None
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        return conn
    except Exception as e:
        print(f"Грешка при връзка с DB: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS workspaces (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.execute("""
                    INSERT INTO workspaces (name) VALUES ('general') ON CONFLICT (name) DO NOTHING;
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS verified_facts (
                        id SERIAL PRIMARY KEY,
                        workspace VARCHAR(100) NOT NULL,
                        content TEXT NOT NULL,
                        category VARCHAR(100),
                        confidence INT DEFAULT 100,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS causal_chains (
                        id SERIAL PRIMARY KEY,
                        workspace VARCHAR(100) NOT NULL,
                        cause TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS chat_history (
                        id SERIAL PRIMARY KEY,
                        workspace VARCHAR(100) DEFAULT 'general',
                        sender VARCHAR(20) NOT NULL,
                        message TEXT NOT NULL,
                        monologue TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                # Миграционни проверки за колони
                cur.execute("""
                    DO $$ 
                    BEGIN
                        BEGIN
                            ALTER TABLE chat_history ADD COLUMN monologue TEXT;
                        EXCEPTION
                            WHEN duplicate_column THEN NULL;
                        END;
                        BEGIN
                            ALTER TABLE chat_history ADD COLUMN workspace VARCHAR(100) DEFAULT 'general';
                        EXCEPTION
                            WHEN duplicate_column THEN NULL;
                        END;
                    END $$;
                """)
            conn.commit()
        except Exception as e:
            print(f"Грешка при създаване/миграция на таблици: {e}")
        finally:
            conn.close()

def get_workspace_facts(ws_name):
    conn = get_db_connection()
    facts = []
    if conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT content, category, confidence, created_at FROM verified_facts WHERE workspace = %s ORDER BY id DESC;", (ws_name,))
                rows = cur.fetchall()
                for r in rows:
                    facts.append({
                        "content": r["content"],
                        "category": r["category"],
                        "confidence": r["confidence"],
                        "timestamp": r["created_at"].strftime("%Y-%m-%d %H:%M:%S") if r["created_at"] else ""
                    })
        except Exception as e:
            print(f"DB Read Error: {e}")
        finally:
            conn.close()
    return facts

def add_workspace_fact(ws_name, content, category="ДИРЕКТЕН ЗАПИС", confidence=100):
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO verified_facts (workspace, content, category, confidence) VALUES (%s, %s, %s, %s);", (ws_name, content, category, confidence))
                cur.execute("INSERT INTO causal_chains (workspace, cause) VALUES (%s, %s);", (ws_name, content))
                conn.commit()
        except Exception as e:
            print(f"DB Write Error: {e}")
        finally:
            conn.close()

def save_chat_message(ws_name, sender, message, monologue=None):
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("INSERT INTO chat_history (workspace, sender, message, monologue) VALUES (%s, %s, %s, %s);", (ws_name, sender, message, monologue))
                conn.commit()
        except Exception as e:
            print(f"Chat DB Save Error: {e}")
        finally:
            conn.close()

def get_chat_history(ws_name):
    conn = get_db_connection()
    history = []
    if conn:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT sender, message, monologue, created_at FROM chat_history WHERE workspace = %s ORDER BY id ASC;", (ws_name,))
                rows = cur.fetchall()
                for r in rows:
                    history.append({
                        "sender": r["sender"],
                        "message": r["message"],
                        "monologue": r["monologue"],
                        "timestamp": r["created_at"].strftime("%H:%M") if r["created_at"] else ""
                    })
        except Exception as e:
            print(f"Chat DB Read Error: {e}")
        finally:
            conn.close()
    return history

def clear_workspace_data(ws_name):
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM verified_facts WHERE workspace = %s;", (ws_name,))
                cur.execute("DELETE FROM causal_chains WHERE workspace = %s;", (ws_name,))
                cur.execute("DELETE FROM chat_history WHERE workspace = %s;", (ws_name,))
                cur.execute("DELETE FROM workspaces WHERE name = %s;", (ws_name,))
                conn.commit()
        except Exception as e:
            print(f"DB Clear Error: {e}")
        finally:
            conn.close()
