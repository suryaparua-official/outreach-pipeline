import * as dotenv from "dotenv";
dotenv.config();

import { findLookalikeCompanies } from "./stages/ocean";
import { findDecisionMakers } from "./stages/prospeo";
import { resolveEmails } from "./stages/eazyreach";
import { sendOutreachEmails } from "./stages/brevo";
import { confirmBeforeSend } from "./utils/checkpoint";
import { logger } from "./utils/logger";

function validateEnv() {
  const requiredKeys = [
    "OCEAN_API_KEY",
    "PROSPEO_API_KEY",
    "EAZYREACH_CLIENT_ID",
    "EAZYREACH_CLIENT_SECRET",
    "BREVO_API_KEY",
    "SENDER_EMAIL",
  ];

  const missingKeys = requiredKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    missingKeys.forEach((key) =>
      logger.error(`Missing required env var: ${key}`),
    );
    process.exit(1);
  }
}

function cleanDomain(domain: string): string {
  const trimmed = domain.trim();
  if (trimmed.toLowerCase().startsWith("http://")) {
    throw new Error("Invalid domain: do not include http://");
  }

  let cleaned = trimmed.toLowerCase();
  if (cleaned.startsWith("https://")) {
    cleaned = cleaned.slice("https://".length);
  }
  cleaned = cleaned.replace(/\/+$/, "");
  return cleaned;
}

async function run() {
  const startTime = Date.now();
  validateEnv();

  const rawSeedDomain = process.argv[2];
  if (!rawSeedDomain) {
    logger.error("Usage: npm start <domain>");
    logger.error("Example: npm start vocallabs.ai");
    process.exit(1);
  }

  let seedDomain: string;
  try {
    seedDomain = cleanDomain(rawSeedDomain);
  } catch (error: any) {
    logger.error(error.message);
    process.exit(1);
  }

  if (!seedDomain.includes(".")) {
    logger.error(
      "Invalid domain: please provide a domain name without protocol.",
    );
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`  OUTREACH PIPELINE`);
  console.log(`  Seed: ${seedDomain}`);
  console.log("=".repeat(50));

  // Stage 1
  const companies = await findLookalikeCompanies(seedDomain);
  if (companies.length === 0) {
    logger.error("No companies found. Exiting.");
    process.exit(1);
  }

  // Stage 2
  const decisionMakers = await findDecisionMakers(companies);
  if (decisionMakers.length === 0) {
    logger.error("No decision makers found. Exiting.");
    process.exit(1);
  }

  // Stage 3
  const contacts = await resolveEmails(decisionMakers);
  if (contacts.length === 0) {
    logger.error("No verified emails found. Exiting.");
    process.exit(1);
  }

  // Safety checkpoint
  const confirmed = await confirmBeforeSend(contacts);
  if (!confirmed) {
    logger.warn("Aborted by user. No emails sent.");
    process.exit(0);
  }

  // Stage 4
  const sent = await sendOutreachEmails(contacts);

  const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n===== PIPELINE SUMMARY =====");
  console.log(`Companies Found: ${companies.length}`);
  console.log(`Decision Makers: ${decisionMakers.length}`);
  console.log(`Verified Contacts: ${contacts.length}`);
  console.log(`Emails Sent: ${sent}`);
  console.log(`Execution Time: ${executionTime}s`);
  console.log(`Status: SUCCESS`);
  console.log("=============================");
  console.log();
}

run().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
