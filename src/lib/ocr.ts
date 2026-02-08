import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ExtractedData {
  text: string;
  confidence: number;
  fields: {
    amount?: number;
    date?: string;
    invoiceNumber?: string;
    buyerName?: string;
  };
}

export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const convertPdfToImage = async (file: File): Promise<string | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // Get first page
    
    const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context,
      viewport: viewport
    } as any).promise;
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error("Error converting PDF to image:", error);
    return null;
  }
};

const extractFields = (text: string) => {
  const lines = text.split('\n');
  const fields: ExtractedData['fields'] = {};

  // Regex patterns
  const amountRegex = /(?:Total|Grand Total|Amount Due|₹|INR)[\s:₹]*([0-9,]+(?:\.[0-9]{2})?)/i;
  const dateRegex = /(?:Due Date|Payment Due|Date)[\s:]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})/i;
  const invoiceRegex = /(?:Invoice|Bill)\s*(?:No|Number|#)[\s:.]*([A-Z0-9\-\/]+)/i;
  const buyerRegex = /(?:To|Bill To|Customer|Buyer)[\s:]*([A-Za-z0-9\s,\.]+)/i;

  // Amount extraction
  // We look for the largest number that looks like a total amount if specific keywords aren't clear
  // But strictly following the prompt's heuristic first
  const amountMatch = text.match(amountRegex);
  if (amountMatch) {
    const cleanAmount = amountMatch[1].replace(/,/g, '');
    fields.amount = parseFloat(cleanAmount);
  } else {
    // Fallback: Find highest number that looks like currency
    const numbers = text.matchAll(/([0-9,]+\.[0-9]{2})/g);
    let maxVal = 0;
    for (const match of numbers) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxVal) maxVal = val;
    }
    if (maxVal > 0) fields.amount = maxVal;
  }

  // Date extraction
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    fields.date = dateMatch[1];
  }

  // Invoice Number
  const invMatch = text.match(invoiceRegex);
  if (invMatch) {
    fields.invoiceNumber = invMatch[1].trim();
  }

  // Buyer Name (Heuristic: Look for "To:" lines)
  const buyerMatch = text.match(buyerRegex);
  if (buyerMatch) {
    // Take the first line of the match group, trim garbage
    const rawBuyer = buyerMatch[1].split('\n')[0].trim();
    if (rawBuyer.length > 3) {
      fields.buyerName = rawBuyer;
    }
  }

  return fields;
};

export const performOCR = async (file: File): Promise<ExtractedData> => {
  let imageSource: string | File = file;

  // Handle PDF
  if (file.type === 'application/pdf') {
    const pdfImage = await convertPdfToImage(file);
    if (!pdfImage) throw new Error("Failed to process PDF");
    imageSource = pdfImage;
  }

  const worker = await Tesseract.createWorker('eng'); // Default to English
  
  // Optional: Add logging
  // await worker.setParameters({
  //   tessedit_pageseg_mode: Tesseract.PSM.AUTO,
  // });

  const ret = await worker.recognize(imageSource);
  await worker.terminate();

  const text = ret.data.text;
  const confidence = ret.data.confidence;
  const fields = extractFields(text);

  return {
    text,
    confidence,
    fields
  };
};
