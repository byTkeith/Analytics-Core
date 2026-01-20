
import { DataFile } from '../types';

const ULTI_SALES_MAPPING: Record<string, string> = {
  'ITM_CDE': 'Product Code',
  'ITM_DSC': 'Description',
  'QTY_SLD': 'Quantity Sold',
  'SLS_AMT': 'Sales Amount',
  'CST_AMT': 'Cost Amount',
  'TRN_DTE': 'Transaction Date',
  'REP_ID': 'Sales Rep',
  'STK_LVL': 'Stock Level',
  'VND_NME': 'Vendor Name',
  'CAT_CDE': 'Category',
  'TAX_AMT': 'Tax Amount',
  'DSC_AMT': 'Discount Amount',
  'DOC_NUM': 'Document Number',
  'CUST_NME': 'Customer Name'
};

export interface IngestionLog {
  file: string;
  noiseLinesSkipped: number;
  headersFound: string[];
  metadataFound: string[];
}

export const parseUltiSalesFile = async (file: File): Promise<{dataFile: DataFile, log: IngestionLog}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        // @ts-ignore
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to 2D array
        // @ts-ignore
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let headerRowIndex = -1;
        let extractedDate: string | undefined;
        let companyName: string | undefined;
        let noiseLinesSkipped = 0;

        // Step 1: Find the primary header and metadata
        for (let i = 0; i < Math.min(rawRows.length, 50); i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) {
            if (headerRowIndex === -1) noiseLinesSkipped++;
            continue;
          }

          const rowString = row.join(' ').toUpperCase();
          const dateMatch = rowString.match(/\d{4}[\/-]\d{2}[\/-]\d{2}/) || rowString.match(/\d{2}[\/-]\d{2}[\/-]\d{4}/);
          if (dateMatch && !extractedDate) extractedDate = dateMatch[0];

          if (!companyName && row.length < 5 && row[0]?.toString().length > 3) {
            companyName = row[0].toString();
          }

          const matches = row.filter(cell => 
            cell && Object.keys(ULTI_SALES_MAPPING).some(key => cell.toString().toUpperCase().trim() === key)
          );

          if (matches.length >= 2 && headerRowIndex === -1) {
            headerRowIndex = i;
            break;
          } else if (headerRowIndex === -1) {
            noiseLinesSkipped++;
          }
        }

        const actualHeaderIndex = headerRowIndex === -1 ? 0 : headerRowIndex;
        const rawHeaders = rawRows[actualHeaderIndex] || [];
        const cleanedHeaders = rawHeaders.map(h => h?.toString().trim() || 'UNKNOWN');

        // Step 2: Extract data, but also watch for "Secondary Headers" deep in the file
        const dataRows: any[] = [];
        const metadataFound = [];
        if (extractedDate) metadataFound.push(`Date: ${extractedDate}`);
        if (companyName) metadataFound.push(`Org: ${companyName}`);

        for (let i = actualHeaderIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || !row.some(c => c !== null && c !== "")) continue;

          // Check if this looks like another header row (different columns mid-way)
          const isSecondaryHeader = row.filter(cell => 
            cell && Object.keys(ULTI_SALES_MAPPING).some(key => cell.toString().toUpperCase().trim() === key)
          ).length >= 2;

          if (isSecondaryHeader) {
            // Logic to handle changing context could go here
            // For now, we skip the secondary header row itself but continue ingestion
            continue; 
          }

          const obj: any = {};
          cleanedHeaders.forEach((header, idx) => {
            const mappedName = ULTI_SALES_MAPPING[header.toUpperCase()] || header;
            obj[mappedName] = row[idx];
          });
          dataRows.push(obj);
        }

        const log: IngestionLog = {
          file: file.name,
          noiseLinesSkipped,
          headersFound: cleanedHeaders.map(h => ULTI_SALES_MAPPING[h.toUpperCase()] || h),
          metadataFound
        };

        resolve({
          dataFile: {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            headers: cleanedHeaders.map(h => ULTI_SALES_MAPPING[h.toUpperCase()] || h),
            rows: dataRows,
            rowCount: dataRows.length,
            metadata: { extractedDate, companyName }
          },
          log
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
