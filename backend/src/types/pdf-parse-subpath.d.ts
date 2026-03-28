declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfResult {
    text?: string;
    numpages?: number;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfResult>;
  export default pdfParse;
}
