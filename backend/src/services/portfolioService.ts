import { firestore } from "../config/firebase";
import { generateHTML } from "../utils/htmlGenerator";
import { generatePDF } from "../utils/pdfGenerator";
import { v4 as uuid } from "uuid";
import { PagesPublisher } from "./pagePublisher";

export async function generatePortfolio(userId: string) {
  console.log(`Generating portfolio for user: ${userId}`);

  // Fetch user data from Firestore
  const data = await getUserData(userId);

  // 📝 Generate HTML
  const htmlContent = generateHTML(data);

  // 📄 Generate PDF (buffer)
  const pdfBuffer = await generatePDF(htmlContent);

  // Generate unique folder ID once
  const uniqueId = uuid();
  const folder = `users/${userId}-${uniqueId}`;

  // ✅ Publish HTML to GitHub Pages
  const htmlUrl = await PagesPublisher.publishFile(
      `${folder}/index.html`,
      htmlContent,
      `feat: publish HTML portfolio for ${userId}`
  );

  // ✅ Publish PDF to GitHub Pages
  const pdfUrl = await PagesPublisher.publishFile(
      `${folder}/portfolio.pdf`,
      pdfBuffer.toString("base64"),
      `feat: publish PDF portfolio for ${userId}`
  );

  // Create/update root index.html for GitHub Pages
  const indexContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Career Portfolio</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .portfolio-link { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>AI Career Portfolio Generator</h1>
    <div class="portfolio-link">
        <h3>Latest Portfolio Generated</h3>
        <p><a href="${folder}/index.html" target="_blank">View Portfolio</a></p>
        <p><a href="${folder}/portfolio.pdf" target="_blank">Download PDF</a></p>
    </div>
</body>
</html>`;

  await PagesPublisher.publishFile(
      'index.html',
      indexContent,
      'feat: update main index page'
  );

  return {
    htmlUrl,
    pdfUrl,
    message: `Portfolio generated successfully! View at: ${htmlUrl}`
  };
}

async function getUserData(userId: string) {
  if (!firestore) {
    console.warn("Firestore not available, using mock data");
    return {
      name: "Sample User",
      bio: "Software Developer",
      skills: ["JavaScript", "Node.js", "React"],
      projects: []
    };
  }

  try {
    const userDoc = await firestore.collection("users").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data();
    } else {
      console.warn(`No user data found for ${userId}, using mock data`);
      return {
        name: "Sample User",
        bio: "Software Developer",
        skills: ["JavaScript", "Node.js", "React"],
        projects: []
      };
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      name: "Sample User",
      bio: "Software Developer",
      skills: ["JavaScript", "Node.js", "React"],
      projects: []
    };
  }
}
