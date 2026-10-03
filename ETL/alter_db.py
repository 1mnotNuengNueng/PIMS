import pymysql

def main():
    conn = pymysql.connect(host='localhost', user='root', password='', database='strategic_projects')
    cursor = conn.cursor()
    
    # Check if columns exist in dim_project
    cursor.execute("SHOW COLUMNS FROM dim_project")
    columns = [col[0] for col in cursor.fetchall()]
    
    alter_stmts = []
    if 'strategic_goal' not in columns:
        alter_stmts.append("ADD COLUMN strategic_goal TEXT")
    if 'strategic_kpi' not in columns:
        alter_stmts.append("ADD COLUMN strategic_kpi TEXT")
    if 'project_kpi' not in columns:
        alter_stmts.append("ADD COLUMN project_kpi TEXT")
    if 'target_date' not in columns:
        alter_stmts.append("ADD COLUMN target_date VARCHAR(255)")
    if 'budget' not in columns:
        alter_stmts.append("ADD COLUMN budget DECIMAL(15, 2)")
        
    if alter_stmts:
        alter_query = f"ALTER TABLE dim_project {', '.join(alter_stmts)};"
        print(f"Executing: {alter_query}")
        cursor.execute(alter_query)
        conn.commit()
        print("dim_project table altered successfully.")
    else:
        print("dim_project table already has the required columns.")

if __name__ == '__main__':
    main()
