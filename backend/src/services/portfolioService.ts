// backend/src/services/portfolioService.ts
import { firestore } from "../config/firebase";
import { generateHTML } from "../utils/htmlGenerator";
import { generatePDF } from "../utils/pdfGenerator";
import { v4 as uuid } from "uuid";
import { getStorage } from "firebase-admin/storage";

export async function generatePortfolio(userId: string) {
  // Ensure Firestore is initialized
  if (!firestore) {
    throw new Error("Firestore is not initialized");
  }

  // Get user data
  const userDoc = await firestore.collection("profiles").doc(userId).collection("draft").doc("profile").get();
  if (!userDoc.exists) throw new Error("User not found");

  const data = userDoc.data();

  // Generate HTML
  const html = generateHTML(data);

  // Generate PDF buffer
  const pdfBuffer = await generatePDF(html);

  // Firebase Storage bucket
  const bucket = getStorage().bucket();
  const folder = `portfolios/${userId}-${uuid()}`;

  // Save HTML
  const htmlFile = bucket.file(`${folder}/index.html`);
  await htmlFile.save(html, { contentType: "text/html" });

  // Save PDF
  const pdfFile = bucket.file(`${folder}/portfolio.pdf`);
  await pdfFile.save(pdfBuffer, { contentType: "application/pdf" });

  // Generate signed URLs (valid for 7 days)
  const [htmlUrl] = await htmlFile.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const [pdfUrl] = await pdfFile.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return { htmlUrl, pdfUrl };
}