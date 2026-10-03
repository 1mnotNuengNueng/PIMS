import pandas as pd
import json

def main():
    file_path = 'Data/2. รายงานผลแผนปฏิบัติการประจำปี 2569.xlsx'
    df = pd.read_excel(file_path, sheet_name='1.รองวิจัย', nrows=15)
    data = df.where(pd.notnull(df), None).to_dict(orient='records')
    
    with open('sheet_rongwijai.json', 'w', encoding='utf-8') as f:
        json.dump({'columns': list(df.columns), 'data': data}, f, ensure_ascii=False, indent=2, default=str)

if __name__ == '__main__':
    main()
