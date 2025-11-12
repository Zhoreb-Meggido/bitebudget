import { useState } from 'react';
import initSqlJs, { Database } from 'sql.js';

interface TableInfo {
  name: string;
  sql: string;
  columns: ColumnInfo[];
  rowCount: number;
  sampleRows: any[];
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export function SQLiteSchemaExplorer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setTables([]);
    setSelectedTable('');

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Open database
      const database = new SQL.Database(uint8Array);
      setDb(database);

      // Get all tables
      const tablesResult = database.exec(`
        SELECT name, sql
        FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      if (tablesResult.length === 0 || !tablesResult[0].values.length) {
        setError('Geen tabellen gevonden in de database');
        setLoading(false);
        return;
      }

      // Get table info
      const tableInfos: TableInfo[] = [];
      for (const [tableName, sql] of tablesResult[0].values) {
        try {
          // Get column info
          const columnsResult = database.exec(`PRAGMA table_info(${tableName})`);
          const columns: ColumnInfo[] = columnsResult[0]?.values.map((row) => ({
            cid: row[0] as number,
            name: row[1] as string,
            type: row[2] as string,
            notnull: row[3] as number,
            dflt_value: row[4],
            pk: row[5] as number,
          })) || [];

          // Get row count
          const countResult = database.exec(`SELECT COUNT(*) FROM ${tableName}`);
          const rowCount = countResult[0]?.values[0]?.[0] as number || 0;

          // Get sample rows (first 5)
          const sampleResult = database.exec(`SELECT * FROM ${tableName} LIMIT 5`);
          const sampleRows = sampleResult[0]?.values.map(row => {
            const obj: any = {};
            columns.forEach((col, idx) => {
              obj[col.name] = row[idx];
            });
            return obj;
          }) || [];

          tableInfos.push({
            name: tableName as string,
            sql: sql as string,
            columns,
            rowCount,
            sampleRows,
          });
        } catch (err) {
          console.error(`Error getting info for table ${tableName}:`, err);
        }
      }

      setTables(tableInfos);
      if (tableInfos.length > 0) {
        setSelectedTable(tableInfos[0].name);
      }
    } catch (err: any) {
      setError(`Database parsing error: ${err?.message || err}`);
      console.error('SQLite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHealthConnectData = () => {
    if (!db) return;

    setAnalyzing(true);
    try {
      // Look for common Health Connect patterns
      const healthTables = tables.filter(t =>
        t.name.toLowerCase().includes('health') ||
        t.name.toLowerCase().includes('steps') ||
        t.name.toLowerCase().includes('heart') ||
        t.name.toLowerCase().includes('sleep') ||
        t.name.toLowerCase().includes('activity') ||
        t.name.toLowerCase().includes('record')
      );

      if (healthTables.length > 0) {
        alert(`Gevonden ${healthTables.length} mogelijke Health Connect tabellen:\n${healthTables.map(t => `- ${t.name} (${t.rowCount} records)`).join('\n')}`);
      } else {
        alert('Geen duidelijke Health Connect tabellen gevonden. Inspecteer het schema handmatig.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedTableInfo = tables.find(t => t.name === selectedTable);

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">SQLite Schema Explorer</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload een SQLite database om het schema te inspecteren (bijv. Health Connect backup)
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-800">
            ✗ {error}
          </div>
        )}

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={handleFileUpload}
            className="hidden"
            id="sqlite-file-input"
            disabled={loading}
          />
          <label
            htmlFor="sqlite-file-input"
            className="cursor-pointer"
          >
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {loading ? 'Bezig met laden...' : 'Klik om SQLite database te selecteren'}
            </p>
            <p className="text-sm text-gray-600">
              Ondersteund: .db, .sqlite, .sqlite3 bestanden
            </p>
          </label>
        </div>

        {/* Database Overview */}
        {tables.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                Database Schema ({tables.length} tabellen)
              </h3>
              <button
                onClick={analyzeHealthConnectData}
                disabled={analyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                {analyzing ? 'Bezig met analyseren...' : '🔍 Detecteer Health Connect tabellen'}
              </button>
            </div>

            {/* Table Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecteer tabel om te inspecteren:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tables.map(table => (
                  <option key={table.name} value={table.name}>
                    {table.name} ({table.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            {/* Table Details */}
            {selectedTableInfo && (
              <div className="space-y-4">
                {/* Columns */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Kolommen ({selectedTableInfo.columns.length})
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Naam
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Verplicht
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Primary Key
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedTableInfo.columns.map((col) => (
                          <tr key={col.cid}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {col.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {col.type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {col.notnull ? '✓' : ''}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {col.pk ? '🔑' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Data */}
                {selectedTableInfo.sampleRows.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Voorbeeld Data (eerste {selectedTableInfo.sampleRows.length} rijen)
                    </h4>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {selectedTableInfo.columns.map((col) => (
                              <th
                                key={col.name}
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap"
                              >
                                {col.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedTableInfo.sampleRows.map((row, idx) => (
                            <tr key={idx}>
                              {selectedTableInfo.columns.map((col) => (
                                <td
                                  key={col.name}
                                  className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap max-w-xs truncate"
                                  title={String(row[col.name])}
                                >
                                  {row[col.name] === null || row[col.name] === undefined
                                    ? <span className="text-gray-400 italic">null</span>
                                    : String(row[col.name])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CREATE TABLE SQL */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">CREATE TABLE Statement</h4>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                    {selectedTableInfo.sql}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Gebruik</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload je Health Connect backup database (.db bestand)</li>
            <li>• Inspecteer het schema om te zien welke tabellen beschikbaar zijn</li>
            <li>• Gebruik "Detecteer Health Connect tabellen" om relevante data te vinden</li>
            <li>• Noteer de tabel namen en kolommen voor de import mapping</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
