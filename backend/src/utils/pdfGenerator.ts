// backend/src/utils/pdfGenerator.ts
import puppeteer from "puppeteer";

/**
 * Generates a PDF buffer from HTML content
 * @param html - HTML string of portfolio
 * @returns Buffer containing PDF data
 */
export async function generatePDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true
  }) as Buffer;

  await browser.close();

  return pdfBuffer;
}
