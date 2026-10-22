// Turns base64 PDF bytes from an export function into a browser download.
// Mirrors downloadDocxFile from downloadDocx.js.
export function downloadPdfFile(base64, filename, fallback = 'document.pdf') {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || fallback;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
