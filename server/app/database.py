import sqlite3
import json
import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from .config import settings

def get_db_file() -> Path:
    return Path(settings.DATABASE_URL.replace("sqlite:///", ""))

DB_FILE = get_db_file()

def init_db():
    db_file = get_db_file()
    try:
        db_file.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    with sqlite3.connect(db_file) as conn:
        cursor = conn.cursor()
        
        # 1. Decision Records Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decision_records (
                record_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                dataset_name TEXT NOT NULL,
                strategy TEXT NOT NULL,
                reproducibility_hash TEXT NOT NULL,
                record_json TEXT NOT NULL
            )
        """)
        
        # 2. Scenario Runs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scenario_runs (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                scenario_type TEXT NOT NULL,
                dataset_id TEXT NOT NULL,
                result_json TEXT NOT NULL
            )
        """)

        # 3. Audit Log Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                details TEXT
            )
        """)
        conn.commit()

class DatabaseManager:
    def __init__(self):
        init_db()

    def save_decision_record(self, record_id: str, dataset_id: str, dataset_name: str, strategy: str, hash_val: str, data: Dict[str, Any]):
        now = datetime.datetime.utcnow().isoformat() + "Z"
        with sqlite3.connect(get_db_file()) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO decision_records (record_id, created_at, dataset_id, dataset_name, strategy, reproducibility_hash, record_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (record_id, now, dataset_id, dataset_name, strategy, hash_val, json.dumps(data)))
            
            cursor.execute("""
                INSERT INTO audit_logs (timestamp, action, details)
                VALUES (?, ?, ?)
            """, (now, "SAVE_DECISION_RECORD", f"Saved record {record_id} for {dataset_name}"))
            conn.commit()

    def get_decision_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        with sqlite3.connect(get_db_file()) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT record_json FROM decision_records WHERE record_id = ?", (record_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def list_decision_records(self) -> List[Dict[str, Any]]:
        with sqlite3.connect(get_db_file()) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT record_id, created_at, dataset_id, dataset_name, strategy, reproducibility_hash FROM decision_records ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [
                {
                    "record_id": r[0],
                    "created_at": r[1],
                    "dataset_id": r[2],
                    "dataset_name": r[3],
                    "strategy": r[4],
                    "reproducibility_hash": r[5]
                }
                for r in rows
            ]

db_manager = DatabaseManager()
