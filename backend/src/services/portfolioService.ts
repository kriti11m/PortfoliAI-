import { firestore } from "../config/firebase";
import { generateHTML } from "../utils/htmlGenerator";
import { generatePDF } from "../utils/pdfGenerator";
import { v4 as uuid } from "uuid";
import { PagesPublisher } from "./pagePublisher";

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function getUserData(userId: string) {
  console.log(`🔍 Fetching user data for: ${userId}`);

  if (!firestore) {
    console.warn("⚠️ Firestore is not initialized, using mock data");
    return {
      name: "Sample User",
      bio: "Backend Developer",
      skills: ["Java", "Spring Boot", "PostgreSQL"],
      projects: []
    };
  }

  try {
    // Try exact userId first
    console.log(`📋 Querying Firestore collection 'users' with doc ID: ${userId}`);
    const userDoc = await firestore.collection("users").doc(userId).get();

    if (userDoc.exists) {
      console.log(`✅ User found with exact ID: ${userId}`);
      const userData = userDoc.data();
      console.log(`📄 User data:`, userData);
      return userData;
    }

    // If not found, try to find by phone number in the data
    console.log(`🔍 User not found with exact ID, searching by phone number...`);
    const usersSnapshot = await firestore.collection("users")
      .where("phoneNumber", "==", userId)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      console.log(`✅ User found by phone number: ${userId}`);
      console.log(`📄 User data:`, userData);
      return userData;
    }

    // Try searching for partial phone number match
    const phoneOnly = userId.replace("whatsapp:", "");
    console.log(`🔍 Searching for phone number: ${phoneOnly}`);

    const phoneSnapshot = await firestore.collection("users")
      .where("phoneNumber", "==", phoneOnly)
      .limit(1)
      .get();

    if (!phoneSnapshot.empty) {
      const userData = phoneSnapshot.docs[0].data();
      console.log(`✅ User found by phone number (without prefix): ${phoneOnly}`);
      console.log(`📄 User data:`, userData);
      return userData;
    }

    // If still not found, provide default data
    console.warn(`⚠️ User ${userId} not found in Firestore, using default data`);
    return {
      name: "Portfolio User",
      bio: "Professional Developer",
      skills: ["Programming", "Problem Solving", "Communication"],
      projects: []
    };

  } catch (error) {
    console.error(`❌ Error fetching user data for ${userId}:`, error);
    return {
      name: "Default User",
      bio: "Software Developer",
      skills: ["JavaScript", "Node.js", "React"],
      projects: []
    };
  }
}

export async function generatePortfolio(userId: string) {
  console.log(`Generating portfolio for user: ${userId}`);

  const data = await getUserData(userId);

  const htmlContent = generateHTML(data);
  const pdfBuffer = await generatePDF(htmlContent);

  const uniqueId = uuid();
  const safeUserId = sanitizeUserId(userId);
  const folder = `docs/users/${safeUserId}-${uniqueId}`;

  // ✅ Publish HTML
  const htmlUrl = await PagesPublisher.publishFile(
      `${folder}/index.html`,
      htmlContent,
      `feat: publish portfolio for ${userId}`
  );

  // ✅ Publish PDF
  const pdfUrl = await PagesPublisher.publishFile(
      `${folder}/portfolio.pdf`,
      pdfBuffer.toString("base64"),
      `feat: publish portfolio for ${userId}`
  );

  // ✅ Root index.html (link uses safeUserId too)
  const indexContent = `
<!DOCTYPE html>
<html>
<head>
  <title>AI Career Portfolio Generator</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>AI Career Portfolio Generator</h1>
  <div>
    <h3>Latest Portfolio Generated</h3>
    <p><strong>User:</strong> ${userId}</p>
    <p><a href="users/${safeUserId}-${uniqueId}/index.html" target="_blank">📄 View HTML Portfolio</a></p>
    <p><a href="users/${safeUserId}-${uniqueId}/portfolio.pdf" target="_blank">📁 Download PDF Portfolio</a></p>
  </div>
</body>
</html>`;

  await PagesPublisher.publishFile(
      "docs/index.html",
      indexContent,
      "feat: update main portfolio index page"
  );

  // ✅ Correct GitHub Pages URLs
  const baseUrl =
      process.env.GITHUB_PAGES_BASE ||
      `https://${process.env.GITHUB_USERNAME}.github.io/${process.env.GITHUB_REPO}`;
  const finalHtmlUrl = `${baseUrl}/users/${safeUserId}-${uniqueId}/index.html`;
  const finalPdfUrl = `${baseUrl}/users/${safeUserId}-${uniqueId}/portfolio.pdf`;

  return {
    htmlUrl: finalHtmlUrl,
    pdfUrl: finalPdfUrl,
    message: `Portfolio generated successfully! View at: ${finalHtmlUrl}`,
  };
}

