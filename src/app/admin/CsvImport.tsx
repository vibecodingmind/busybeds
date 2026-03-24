'use client';

import { useState, useRef } from 'react';

interface ParsedRow {
  [key: string]: string;
}

const CSV_TEMPLATE = `name,city,country,descriptionShort,starRating,discountPercent,coverImage,websiteUrl
The Grand Hotel,Paris,France,Luxury 5-star hotel in the heart of Paris,5,20,https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600,https://thegrandhotel.com
Hotel Serenity,Tokyo,Japan,Modern boutique hotel with stunning views,4,15,https://images.unsplash.com/photo-1597696058638-3fb51e7152e7?w=600,https://hotelserenity.jp
Budget Inn,Barcelona,Spain,Affordable and comfortable for travelers,3,30,https://images.unsplash.com/photo-1585030174967-bc2e0f3135f3?w=600,https://budgetinn.es
Sunset Resort,Bali,Indonesia,Beach resort with water sports and spa,5,25,,https://sunsetresort.id`;

const TEMPLATE_FILENAME = 'hotel-import-template.csv';

export default function CsvImport() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csv: string): ParsedRow[] => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.some(v => v)) {
        // Only add if row has at least one value
        const row: ParsedRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please select a .csv file');
      return;
    }

    setErrorMessage('');
    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const parsed = parseCSV(csv);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows
      } catch (err) {
        setErrorMessage('Failed to parse CSV file');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const csv = await file.text();
      const rows = parseCSV(csv);

      if (rows.length === 0) {
        setErrorMessage('No valid rows found in CSV');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/hotels/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Import failed');
      } else {
        setResult(data);
        setFile(null);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setErrorMessage('An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = TEMPLATE_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="btn-primary text-sm py-2 px-4"
      >
        📥 Import Hotels via CSV
      </button>
    );
  }

  return (
    <div className="card p-6 mb-6 border-l-4" style={{ borderLeftColor: '#0E7C7B' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg" style={{ color: '#1A3C5E' }}>
          Import Hotels via CSV
        </h3>
        <button
          onClick={() => {
            setIsExpanded(false);
            setFile(null);
            setPreview([]);
            setResult(null);
            setErrorMessage('');
          }}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* File Input */}
      {!result && (
        <>
          <div className="mb-4">
            <label className="label block mb-2">Select CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a .csv file with hotel data. Required columns: name, city, country, descriptionShort
            </p>
          </div>

          {/* Template Download */}
          <div className="mb-4">
            <button
              onClick={downloadTemplate}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
            >
              📋 Download CSV Template
            </button>
          </div>

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Preview (First 5 Rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        {Object.values(row).map((val, colIdx) => (
                          <td key={colIdx} className="px-3 py-2 text-gray-600 truncate max-w-xs">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Import Button */}
          {preview.length > 0 && (
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn-primary w-full py-2 disabled:opacity-50"
            >
              {loading ? 'Importing...' : `Import ${preview.length} Hotels`}
            </button>
          )}
        </>
      )}

      {/* Result Message */}
      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-semibold text-green-700">
              ✅ Created {result.created} hotel{result.created !== 1 ? 's' : ''}
            </div>
          </div>

          {result.skipped > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-semibold text-yellow-700">
                ⚠️ Skipped {result.skipped} duplicate{result.skipped !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-semibold text-red-700 mb-2">Errors:</div>
              <ul className="text-xs text-red-600 space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setResult(null);
              setFile(null);
              setPreview([]);
              setErrorMessage('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="btn-primary w-full py-2"
          >
            Import More Hotels
          </button>
        </div>
      )}
    </div>
  );
}
