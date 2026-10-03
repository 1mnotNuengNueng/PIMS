import pandas as pd
import pymysql
import math
import re

def get_or_create(cursor, table, col, val):
    if not val or (isinstance(val, float) and math.isnan(val)):
        return None
    val = str(val).strip()
    cursor.execute(f"SELECT id FROM {table} WHERE {col} = %s", (val,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute(f"INSERT INTO {table} ({col}) VALUES (%s)", (val,))
    return cursor.lastrowid

def main():
    conn = pymysql.connect(host='localhost', user='root', password='', database='strategic_projects')
    cursor = conn.cursor()
    
    # Reset tables
    cursor.execute('SET FOREIGN_KEY_CHECKS=0')
    cursor.execute('TRUNCATE TABLE fact_table')
    cursor.execute('TRUNCATE TABLE dim_project')
    cursor.execute('TRUNCATE TABLE dim_agency')
    cursor.execute('SET FOREIGN_KEY_CHECKS=1')
    
    # Ensure default time_id to Q3
    cursor.execute("SELECT id FROM dim_time WHERE quarter=3 LIMIT 1")
    res = cursor.fetchone()
    if not res:
        cursor.execute("INSERT INTO dim_time (year, quarter, month, date) VALUES (2569, 3, 6, 30)")
        default_time_id = cursor.lastrowid
    else:
        default_time_id = res[0]
        
    file_path = 'Data/2. รายงานผลแผนปฏิบัติการประจำปี 2569.xlsx'
    xl = pd.ExcelFile(file_path)
    
    # Process both Strategy sheets and Dept sheets
    target_sheets = ['ย.1', 'ย.2', 'ย.3', 'ย.4'] + [s for s in xl.sheet_names if s not in ['สรุปจำนวนโครงการ+ตัวชี้วัด', 'ไตรมาสที่ 1-4', 'แผนภูมิสรุป', 'ร้อยละดำเนินงาน', 'สรุป', 'ย.1', 'ย.2', 'ย.3', 'ย.4', 'รายละเอียดประกอบโครงการ', 'Sheet2']]
    
    project_map = {} # name -> id
    cancellation_notes = [] # list of strings containing "ยกเลิก"
    total_canceled = 0
    
    for sheet in target_sheets:
        df = pd.read_excel(file_path, sheet_name=sheet, header=None)
        current_strategy_id = None
        last_strategic_goal = ""
        last_strategic_kpi = ""
        last_project_id = None
        project_status = "process"
        project_budget_note = ""
        project_achieved_kpi = 0
        
        def commit_last_project():
            nonlocal last_project_id, project_status, project_budget_note, project_achieved_kpi, total_canceled
            if last_project_id:
                if "ยกเลิก" in project_budget_note:
                    project_status = "canceled"
                cursor.execute("""
                    INSERT INTO fact_table (time_id, project_id, status, successed_kpi, result_text)
                    VALUES (%s, %s, %s, %s, %s)
                """, (default_time_id, last_project_id, project_status, project_achieved_kpi, project_budget_note.strip()))
                if project_status == "canceled":
                    total_canceled += 1
                last_project_id = None
                project_status = "process"
                project_budget_note = ""
                project_achieved_kpi = 0

        for idx in range(len(df)):
            row = df.iloc[idx]
            col0 = str(row[0]).strip() if not pd.isna(row[0]) else ""
            col3 = str(row[3]).strip() if not pd.isna(row[3]) else ""
            col8 = str(row[8]).strip() if not pd.isna(row[8]) else ""
            
            # 1. Detect Strategy
            if col0.startswith("ประเด็นยุทธศาสตร์"):
                current_strategy_id = get_or_create(cursor, 'dim_strategy', 'name', col0)
            
            if not current_strategy_id and (col3 and not col3.startswith("ผล:")):
                if col0 and "ยุทธศาสตร์" in col0:
                    current_strategy_id = get_or_create(cursor, 'dim_strategy', 'name', col0)
                else:
                    current_strategy_id = get_or_create(cursor, 'dim_strategy', 'name', f"Strategy from {sheet}")
            
            # Track any cancellation notes in col0 or col8
            if "ยกเลิก" in col0: cancellation_notes.append(col0)
            if "ยกเลิก" in col8: cancellation_notes.append(col8)
            
            # Detect Result ("ผล:")
            if col3.startswith("ผล:"):
                if last_project_id:
                    res_parts = [col3]
                    for c in range(4, len(row)):
                        if c == 5 and not pd.isna(row[5]):
                            try:
                                project_achieved_kpi = int(float(row[5]))
                            except ValueError:
                                nums = re.findall(r'\d+', str(row[5]))
                                if nums:
                                    project_achieved_kpi = int(nums[0])
                        
                        if not pd.isna(row[c]) and str(row[c]).strip():
                            res_parts.append(str(row[c]).strip())
                    
                    full_result = " | ".join(res_parts)
                    project_budget_note = project_budget_note + " \n " + full_result if project_budget_note else full_result
                    
                    if "ยกเลิก" in full_result:
                        project_status = "canceled"
                    elif "þ" in full_result or "✓" in full_result or "ดำเนินการแล้วเสร็จ" in full_result or "เรียบร้อยแล้ว" in full_result:
                        project_status = "successed"
                        
                    commit_last_project()
                continue
            
            # Normal Project Row detection
            if col3 and col3 != "โครงการ/กิจกรรม" and col3 != "nan":
                # Before starting a new project, commit the previous one
                commit_last_project()
                
                if "ยกเลิก" in col3:
                    cancellation_notes.append(col3)
                    
                if col0 and col0 != "เป้าประสงค์เชิงกลยุทธ์":
                    last_strategic_goal = col0
                col1 = str(row[1]).strip() if not pd.isna(row[1]) else ""
                if col1 and col1 != "ตัวชี้วัดระดับยุทธศาสตร์":
                    last_strategic_kpi = col1
                    
                col7 = str(row[7]).strip() if not pd.isna(row[7]) else ""
                
                # Responsible person is always col7
                resp_person = col7 if col7 and col7 != "nan" and col7 != "ผู้รับผิดชอบ" else None
                
                # Determine agency name strictly to 21 short sheet names
                if sheet in ['ย.1', 'ย.2', 'ย.3', 'ย.4']:
                    raw = resp_person if resp_person else ""
                    raw_clean = raw.replace('\n', '').replace(' ', '')
                    agency_name = "ไม่ระบุหน่วยงาน"
                    if "คอมพิวเตอร์" in raw_clean: agency_name = "วศ.คต."
                    elif "อุตสาหการ" in raw_clean: agency_name = "วศ.อก."
                    elif "เครื่องกล" in raw_clean: agency_name = "วศ.คก."
                    elif "เกษตรแห่งชาติ" in raw_clean: agency_name = "ศ.เครื่องจักรกลเกษตร"
                    elif "เกษตร" in raw_clean and "นวัตกรรม" in raw_clean: agency_name = "นวัตกรรมเกษตร"
                    elif "เกษตร" in raw_clean: agency_name = "วศ.กษ."
                    elif "ชลประทาน" in raw_clean: agency_name = "วศ.ชป."
                    elif "อาหาร" in raw_clean: agency_name = "วศ.อร."
                    elif "โยธา" in raw_clean and "พิเศษ" in raw_clean: agency_name = "วศ.ยธ.พ."
                    elif "โยธา" in raw_clean: agency_name = "วศ.ยธ."
                    elif "พลังงาน" in raw_clean or "พง." in raw_clean: agency_name = "ศ.วศ.พง."
                    elif "ทดสอบประตู" in raw_clean or "ผนังกระจก" in raw_clean: agency_name = "ศ.ทดสอบประตู"
                    elif "นานาชาติ" in raw_clean: agency_name = "ผชค.นานาชาติ"
                    elif "นวัตกรรมและพันธกิจ" in raw_clean: agency_name = "ผชค.ฝ่ายนวัตกรรม"
                    elif "วิจัยและนวัตกรรมสากล" in raw_clean: agency_name = "รองวิจัย"
                    elif "พัฒนาองค์กร" in raw_clean: agency_name = "รองพัฒนาองค์กร"
                    elif "กายภาพและ" in raw_clean: agency_name = "ผชค.ฝ่ายกายภาพ"
                    elif "บริหารทุนมนุษย์" in raw_clean: agency_name = "รองบริหาร(ผช.บริหาร)"
                    elif "บริหารและความสำเร็จ" in raw_clean: agency_name = "รองบริหาร(การศึกษา)"
                    elif "วิชาการและการเปลี่ยนแปลง" in raw_clean: agency_name = "รองวิชาการ(การศึกษา)"
                else:
                    agency_name = re.sub(r'^\d+\.\s*', '', sheet).strip()
                
                agency_id = get_or_create(cursor, 'dim_agency', 'name', agency_name)
                
                col4 = str(row[4]).strip() if not pd.isna(row[4]) else ""
                col6 = str(row[6]).strip() if not pd.isna(row[6]) else ""
                
                budget = 0.0
                if col8 and col8 != "งบประมาณ":
                    try:
                        budget = float(col8)
                    except ValueError:
                        if "ยกเลิก" in col8:
                            cancellation_notes.append(col8)
                
                # Check if project already exists
                clean_name = col3.strip()
                if clean_name in project_map:
                    last_project_id = project_map[clean_name]
                    # Update agency and responsible person if we are in a department sheet
                    if sheet not in ['ย.1', 'ย.2', 'ย.3', 'ย.4']:
                        cursor.execute("""
                            UPDATE dim_project 
                            SET agency_id = %s, responsible_person = %s 
                            WHERE id = %s
                        """, (agency_id, resp_person, last_project_id))
                else:
                    cursor.execute("""
                        INSERT INTO dim_project (name, agency_id, strategy_id, strategic_goal, strategic_kpi, project_kpi, target_date, budget, responsible_person)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (clean_name, agency_id, current_strategy_id, last_strategic_goal, last_strategic_kpi, col4, col6, budget, resp_person))
                    last_project_id = cursor.lastrowid
                    project_map[clean_name] = last_project_id
        
        # End of sheet
        commit_last_project()

    # Process cancellations globally
    for note in cancellation_notes:
        for p_name, p_id in project_map.items():
            clean_p = re.sub(r'^\d+\.\s*', '', p_name)
            clean_p = clean_p.replace('"', '').replace("'", "")
            
            if clean_p in note or "ยกเลิก" in p_name:
                cursor.execute("UPDATE fact_table SET status = 'canceled' WHERE project_id = %s", (p_id,))
                
                cursor.execute("SELECT result_text FROM fact_table WHERE project_id = %s", (p_id,))
                curr_res = cursor.fetchone()[0] or ""
                if note not in curr_res:
                    new_res = (curr_res + "\n[CANCELLATION NOTE]: " + note).strip()
                    cursor.execute("UPDATE fact_table SET result_text = %s WHERE project_id = %s", (new_res, p_id))

    # Re-calculate total_canceled from database directly
    cursor.execute("SELECT COUNT(DISTINCT project_id) FROM fact_table WHERE status = 'canceled'")
    total_canceled = cursor.fetchone()[0]

    conn.commit()
    print(f"Data imported successfully! Total Unique Projects: {len(project_map)}, Canceled: {total_canceled}")

if __name__ == '__main__':
    main()
