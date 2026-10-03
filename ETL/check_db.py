import pymysql

def main():
    conn = pymysql.connect(host='localhost', user='root', password='', database='strategic_projects')
    cursor = conn.cursor()
    cursor.execute('SHOW TABLES')
    tables = cursor.fetchall()
    for t in tables:
        table_name = t[0]
        print(f"--- Table: {table_name} ---")
        cursor.execute(f"SHOW CREATE TABLE {table_name}")
        create_stmt = cursor.fetchone()[1]
        print(create_stmt)
        print()

if __name__ == '__main__':
    main()
