import sqlite3
import json
import datetime
import os
import time
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple

from .config import settings

logger = logging.getLogger("eco_echo.database")


def get_db_file() -> Path:
    """
    Safely resolves the database file path for SQLite.
    Canonicalizes relative paths to ensure consistency regardless of CWD.
    """
    raw_url = settings.DATABASE_URL
    if raw_url.startswith("sqlite:///"):
        path_str = raw_url[10:]
    elif raw_url.startswith("sqlite://"):
        path_str = raw_url[9:]
    else:
        path_str = raw_url

    # Check for relative path indicators
    path_obj = Path(path_str)
    if not path_obj.is_absolute():
        resolved_path = (settings.BASE_DIR / path_obj).resolve()
    else:
        resolved_path = path_obj.resolve()

    return resolved_path


DB_FILE = get_db_file()


def get_connection(timeout: float = 30.0) -> sqlite3.Connection:
    """
    Creates an optimized SQLite connection configured with WAL journal mode,
    busy timeout, and integrity pragmas for multi-worker safety.
    """
    db_file = get_db_file()
    try:
        db_file.parent.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not verify database directory {db_file.parent}: {e}")

    conn = sqlite3.connect(
        str(db_file),
        timeout=timeout,
        check_same_thread=False
    )
    # Enable WAL mode for high concurrency across multiple processes/threads
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes all required schema tables and indexes safely without dropping existing data."""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            # 1. Decision Records Table (Archived optimization results)
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

            # 2. Scenario Runs Table (Climate / stress-test simulations)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scenario_runs (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    scenario_type TEXT NOT NULL,
                    dataset_id TEXT NOT NULL,
                    result_json TEXT NOT NULL
                )
            """)

            # 3. Audit Log Table (Reproducibility & compliance logging)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details TEXT
                )
            """)

            # 4. Municipal Datasets Table (Persistent storage for uploaded municipal CSV datasets)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    dataset_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    provenance TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    row_count INTEGER NOT NULL,
                    is_sample INTEGER NOT NULL DEFAULT 0,
                    file_size_bytes INTEGER NOT NULL,
                    csv_content TEXT NOT NULL
                )
            """)

            # 5. Implementation Plans Table (Persistent storage for AI / Engineering implementation plans)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS implementation_plans (
                    plan_id TEXT PRIMARY KEY,
                    project_name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    primary_category TEXT NOT NULL,
                    location TEXT NOT NULL,
                    total_cost REAL NOT NULL,
                    currency TEXT NOT NULL,
                    completeness_pct REAL NOT NULL,
                    fits_budget INTEGER NOT NULL,
                    reproducibility_hash TEXT NOT NULL,
                    plan_json TEXT NOT NULL
                )
            """)

            # Useful indexes
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_decision_records_created ON decision_records(created_at);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_implementation_plans_created ON implementation_plans(created_at);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_datasets_created ON datasets(created_at);")

            conn.commit()
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {e}")
        raise


class DatabaseManager:
    """Enterprise relational data manager for ECO-ECHO with full lifecycle persistence."""

    def __init__(self):
        init_db()

    # --------------------------------------------------------------------------
    # 1. Decision Records
    # --------------------------------------------------------------------------
    def save_decision_record(
        self,
        record_id: str,
        dataset_id: str,
        dataset_name: str,
        strategy: str,
        hash_val: str,
        data: Dict[str, Any]
    ):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_connection() as conn:
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
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT record_json FROM decision_records WHERE record_id = ?", (record_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def list_decision_records(self) -> List[Dict[str, Any]]:
        with get_connection() as conn:
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

    def delete_decision_record(self, record_id: str) -> bool:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM decision_records WHERE record_id = ?", (record_id,))
            affected = cursor.rowcount > 0
            conn.commit()
            return affected

    # --------------------------------------------------------------------------
    # 2. Municipal Datasets (Persistent across server restarts)
    # --------------------------------------------------------------------------
    def save_dataset(
        self,
        dataset_id: str,
        name: str,
        description: str,
        provenance: str,
        created_at: str,
        row_count: int,
        is_sample: bool,
        file_size_bytes: int,
        csv_content: str
    ):
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO datasets (
                    dataset_id, name, description, provenance, created_at,
                    row_count, is_sample, file_size_bytes, csv_content
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                dataset_id, name, description, provenance, created_at,
                row_count, 1 if is_sample else 0, file_size_bytes, csv_content
            ))

            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO audit_logs (timestamp, action, details)
                VALUES (?, ?, ?)
            """, (now, "SAVE_DATASET", f"Saved dataset {dataset_id} ({name})"))
            conn.commit()

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT dataset_id, name, description, provenance, created_at, row_count, is_sample, file_size_bytes, csv_content
                FROM datasets WHERE dataset_id = ?
            """, (dataset_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "dataset_id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "provenance": row[3],
                    "created_at": row[4],
                    "row_count": row[5],
                    "is_sample": bool(row[6]),
                    "file_size_bytes": row[7],
                    "csv_content": row[8]
                }
            return None

    def list_datasets(self) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT dataset_id, name, description, provenance, created_at, row_count, is_sample, file_size_bytes
                FROM datasets ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            return [
                {
                    "dataset_id": r[0],
                    "name": r[1],
                    "description": r[2],
                    "provenance": r[3],
                    "created_at": r[4],
                    "row_count": r[5],
                    "is_sample": bool(r[6]),
                    "file_size_bytes": r[7]
                }
                for r in rows
            ]

    def delete_dataset(self, dataset_id: str) -> bool:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM datasets WHERE dataset_id = ?", (dataset_id,))
            affected = cursor.rowcount > 0
            conn.commit()
            return affected

    # --------------------------------------------------------------------------
    # 3. Implementation Plans (Persistent across server restarts)
    # --------------------------------------------------------------------------
    def save_implementation_plan(
        self,
        plan_id: str,
        project_name: str,
        created_at: str,
        primary_category: str,
        location: str,
        total_cost: float,
        currency: str,
        completeness_pct: float,
        fits_budget: bool,
        reproducibility_hash: str,
        data: Dict[str, Any]
    ):
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO implementation_plans (
                    plan_id, project_name, created_at, primary_category,
                    location, total_cost, currency, completeness_pct,
                    fits_budget, reproducibility_hash, plan_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                plan_id, project_name, created_at, primary_category,
                location, total_cost, currency, completeness_pct,
                1 if fits_budget else 0, reproducibility_hash, json.dumps(data)
            ))

            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("""
                INSERT INTO audit_logs (timestamp, action, details)
                VALUES (?, ?, ?)
            """, (now, "SAVE_IMPLEMENTATION_PLAN", f"Saved plan {plan_id} for {location}"))
            conn.commit()

    def get_implementation_plan(self, plan_id: str) -> Optional[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT plan_json FROM implementation_plans WHERE plan_id = ?", (plan_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

    def list_implementation_plans(self) -> List[Dict[str, Any]]:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT plan_id, project_name, created_at, primary_category, location, total_cost, currency, completeness_pct, fits_budget
                FROM implementation_plans ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            return [
                {
                    "plan_id": r[0],
                    "project_name": r[1],
                    "created_at": r[2],
                    "primary_category": r[3],
                    "location": r[4],
                    "total_cost": r[5],
                    "currency": r[6],
                    "completeness_pct": r[7],
                    "fits_budget": bool(r[8]),
                }
                for r in rows
            ]

    def delete_implementation_plan(self, plan_id: str) -> bool:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM implementation_plans WHERE plan_id = ?", (plan_id,))
            affected = cursor.rowcount > 0
            conn.commit()
            return affected

    # --------------------------------------------------------------------------
    # 4. Scenario Runs & Audit Logs
    # --------------------------------------------------------------------------
    def save_scenario_run(self, scenario_id: str, scenario_type: str, dataset_id: str, result: Dict[str, Any]):
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO scenario_runs (id, created_at, scenario_type, dataset_id, result_json)
                VALUES (?, ?, ?, ?, ?)
            """, (scenario_id, now, scenario_type, dataset_id, json.dumps(result)))
            conn.commit()

    # --------------------------------------------------------------------------
    # 5. Live Health & Diagnostic Check
    # --------------------------------------------------------------------------
    def check_connection(self) -> Dict[str, Any]:
        """Performs a live query and latency benchmark without leaking credentials."""
        start_time = time.time()
        try:
            with get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()

                # Gather table counts
                counts = {}
                for tbl in ["decision_records", "datasets", "implementation_plans", "scenario_runs", "audit_logs"]:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
                        counts[tbl] = cursor.fetchone()[0]
                    except Exception:
                        counts[tbl] = 0

                latency_ms = round((time.time() - start_time) * 1000, 2)
                db_file = get_db_file()

                return {
                    "status": "Connected & Operational",
                    "healthy": True,
                    "engine": "SQLite Relational Database (WAL Mode)",
                    "latency_ms": latency_ms,
                    "path": str(db_file.name),
                    "full_path": str(db_file),
                    "table_counts": counts,
                    "journal_mode": "WAL",
                    "error": None,
                }
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
            return {
                "status": "Connection Error",
                "healthy": False,
                "engine": "SQLite Relational Database",
                "latency_ms": None,
                "path": str(get_db_file().name),
                "full_path": str(get_db_file()),
                "table_counts": {},
                "journal_mode": None,
                "error": "Database access error. Details logged safely to server audit log.",
            }


db_manager = DatabaseManager()
