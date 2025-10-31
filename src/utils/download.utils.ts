/**
 * Download utility functies
 * CSP-compliant downloads via data URIs
 */

/**
 * Download text content als bestand via base64 data URI
 */
export function downloadTextFile(content: string, filename: string): void {
  const utf8Bytes = new TextEncoder().encode(content);
  let binaryString = '';

  utf8Bytes.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });

  const base64 = btoa(binaryString);
  const dataUri = 'data:text/plain;charset=utf-8;base64,' + base64;

  const a = document.createElement('a');
  a.href = dataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Download JSON data als bestand
 */
export function downloadJsonFile(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  downloadTextFile(jsonString, filename);
}
