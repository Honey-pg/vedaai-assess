import pdfParse from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${(error as Error).message}`);
  }
}

export function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  return Promise.resolve(buffer.toString('utf-8'));
}
