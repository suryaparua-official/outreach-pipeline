import * as dotenv from "dotenv";
dotenv.config();

import { findLookalikeCompanies } from "./stages/ocean";
import { findDecisionMakers } from "./stages/prospeo";
import { resolveEmails } from "./stages/eazyreach";
import { sendOutreachEmails } from "./stages/brevo";
import { confirmBeforeSend } from "./utils/checkpoint";
import { logger } from "./utils/logger";

async function run() {
  const seedDomain = process.argv[2];

  if (!seedDomain) {
    logger.error("Usage: npm start <domain>");
    logger.error("Example: npm start vocallabs.ai");
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

  console.log("\n" + "=".repeat(50));
  logger.success(`Pipeline complete!`);
  logger.success(`Companies found: ${companies.length}`);
  logger.success(`Decision makers found: ${decisionMakers.length}`);
  logger.success(`Verified contacts: ${contacts.length}`);
  logger.success(`Emails sent: ${sent}`);
  console.log("=".repeat(50) + "\n");
}

run().catch((err) => {
  logger.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
