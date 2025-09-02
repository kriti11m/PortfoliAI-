// backend/src/services/portfolioService.ts
import { firestore, storage } from "../config/firebase";
import { generateHTML } from "../utils/htmlGenerator";
import { generatePDF } from "../utils/pdfGenerator";
import { v4 as uuid } from "uuid";

export async function generatePortfolio(userId: string) {
  // Get draft data instead of user collection
  const draftDoc = await firestore?.collection("drafts").doc(userId).get();
  if (!draftDoc?.exists) throw new Error("User draft not found");

  const data = draftDoc.data();
  console.log("Portfolio data:", data);
  
  // Generate HTML
  const html = generateHTML(data);

  // Generate PDF
  const pdfBuffer = await generatePDF(html);

  if (!storage) {
    throw new Error("Firebase Storage not initialized");
  }

  // Upload HTML & PDF to Firebase Storage
  const folder = `portfolios/${userId}-${uuid()}`;
  const htmlFile = storage.bucket().file(`${folder}/index.html`);
  const pdfFile = storage.bucket().file(`${folder}/portfolio.pdf`);

  await htmlFile.save(html, { 
    metadata: { contentType: "text/html" },
    public: true
  });
  await pdfFile.save(pdfBuffer, { 
    metadata: { contentType: "application/pdf" },
    public: true
  });

  // Make files public and get URLs
  await htmlFile.makePublic();
  await pdfFile.makePublic();

  const htmlUrl = `https://storage.googleapis.com/${htmlFile.bucket.name}/${htmlFile.name}`;
  const pdfUrl = `https://storage.googleapis.com/${pdfFile.bucket.name}/${pdfFile.name}`;

  return { htmlUrl, pdfUrl };
}
