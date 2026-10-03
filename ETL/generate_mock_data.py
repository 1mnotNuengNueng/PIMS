import pymysql
import random
import os

# Connect to database
conn = pymysql.connect(host='localhost', user='root', password='', database='strategic_projects')
cursor = conn.cursor()

try:
    print("Clearing existing fact_table and dim_time...")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    cursor.execute("TRUNCATE TABLE fact_table")
    cursor.execute("TRUNCATE TABLE dim_time")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    # 1. Generate dim_time for 6 years (2564 - 2569)
    years = [2564, 2565, 2566, 2567, 2568, 2569]
    quarters = [
        (1, 12, 31), # Q1: Oct-Dec (End date Dec 31)
        (2, 3, 31),  # Q2: Jan-Mar (End date Mar 31)
        (3, 6, 30),  # Q3: Apr-Jun (End date Jun 30)
        (4, 9, 30)   # Q4: Jul-Sep (End date Sep 30)
    ]

    time_map = {} # year -> list of time_ids for Q1..Q4
    print("Generating dim_time...")
    for year in years:
        time_map[year] = []
        for q, m, d in quarters:
            cursor.execute("INSERT INTO dim_time (year, quarter, month, date) VALUES (%s, %s, %s, %s)", (year, q, m, d))
            time_map[year].append(cursor.lastrowid)

    # 2. Get all project IDs
    print("Fetching projects...")
    cursor.execute("SELECT id FROM dim_project")
    projects = [row[0] for row in cursor.fetchall()]

    # 3. Generate fact_table data
    print("Generating fact_table data for 6 years...")
    for year in years:
        for pid in projects:
            # Determine finishing quarter (0-indexed: 1=Q2, 2=Q3, 3=Q4)
            r = random.random()
            if r < 0.1:
                finish_q_idx = 1 # Q2
            elif r < 0.4:
                finish_q_idx = 2 # Q3
            else:
                finish_q_idx = 3 # Q4
                
            # Determine final status
            final_status = 'successed' if random.random() < 0.9 else 'canceled'
            target_kpi = random.randint(10, 100)
            
            current_kpi = 0
            for q_idx in range(4):
                time_id = time_map[year][q_idx]
                
                if q_idx < finish_q_idx:
                    status = 'process'
                    current_kpi += random.randint(0, int(target_kpi / (finish_q_idx + 1)))
                else:
                    status = final_status
                    if final_status == 'successed':
                        current_kpi = target_kpi
                
                result_text = f"จำลองข้อมูลปี {year} ไตรมาส {q_idx+1}"
                if status == 'canceled':
                    result_text += "\n[CANCELLATION NOTE]: ยกเลิกตามหมายเหตุ"
                elif status == 'successed':
                    result_text += "\nดำเนินการแล้วเสร็จ เรียบร้อยแล้ว"
                    
                cursor.execute("""
                    INSERT INTO fact_table (time_id, project_id, status, successed_kpi, result_text)
                    VALUES (%s, %s, %s, %s, %s)
                """, (time_id, pid, status, current_kpi, result_text))

    conn.commit()
    print("Successfully generated 6 years of mock data!")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    cursor.close()
    conn.close()
