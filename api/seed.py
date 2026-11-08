from pathlib import Path
from sqlalchemy import text


def seed_database_if_empty(engine):
    """
    Автоматично відновлює початкові одеські маршрути, автобуси,
    перевізників та водіїв із SQL-дампу, якщо база порожня.
    """
    try:
        with engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT COUNT(*) FROM companies")).scalar()
                if result and result > 0:
                    print(f"[DB Seed] Database already contains {result} companies, skipping seed.")
                    return
            except Exception as e:
                print(f"[DB Seed] Table check note: {e}")
                return

            # Шукаємо autopark_db.sql
            possible_paths = [
                Path(__file__).resolve().parent.parent / "database" / "autopark_db.sql",
                Path(__file__).resolve().parent / "database" / "autopark_db.sql",
                Path(__file__).resolve().parent / "autopark_db.sql",
            ]
            sql_path = None
            for p in possible_paths:
                if p.is_file():
                    sql_path = p
                    break

            if not sql_path:
                print("[DB Seed] autopark_db.sql not found, seed skipped.")
                return

            lines = sql_path.read_text(encoding="utf-8", errors="replace").splitlines()
            inserts = []
            current_stmt = []
            capturing = False

            for line in lines:
                if "INSERT INTO" in line:
                    capturing = True
                    current_stmt = [line]
                elif capturing:
                    current_stmt.append(line)

                if capturing and line.strip().endswith(";"):
                    inserts.append("\n".join(current_stmt))
                    capturing = False
                    current_stmt = []

            print(f"[DB Seed] Restoring {len(inserts)} tables from autopark_db.sql...")
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            for stmt in inserts:
                try:
                    conn.execute(text(stmt))
                except Exception as ex:
                    print(f"[DB Seed] Error executing statement: {ex}")
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            conn.commit()
            print("[DB Seed] Successfully restored Odessa autopark database data!")
    except Exception as exc:
        print(f"[DB Seed] Notice: {exc}")
