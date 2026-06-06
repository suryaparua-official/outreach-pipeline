import * as readline from "readline";
import { Contact } from "../types.ts";
import { logger } from "./logger";

export async function confirmBeforeSend(contacts: Contact[]): Promise<boolean> {
  console.log("\n" + "=".repeat(50));
  logger.warn("SAFETY CHECKPOINT — Review before sending");
  console.log("=".repeat(50));
  console.log(`\nAbout to send emails to ${contacts.length} contact(s):\n`);

  contacts.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.firstName} ${c.lastName} (${c.title})`);
    console.log(`     ${c.email} — ${c.companyDomain}`);
  });

  console.log("\n" + "=".repeat(50));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("\nSend emails? (yes/no): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}
