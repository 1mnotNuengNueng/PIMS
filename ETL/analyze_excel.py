import pandas as pd
import json

file_path = 'Data/2. รายงานผลแผนปฏิบัติการประจำปี 2569.xlsx'
try:
    # Read all sheet names
    xl = pd.ExcelFile(file_path)
    sheet_names = xl.sheet_names
    
    result = {}
    for sheet in sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=5)
        result[sheet] = {
            'columns': list(df.columns),
            'sample_data': df.to_dict(orient='records')
        }
        
    with open('excel_schema.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False, default=str)
except Exception as e:
    print(f"Error: {e}")
