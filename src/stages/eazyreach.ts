import { DecisionMaker, Contact } from "../types";
import { logger } from "../utils/logger";

export async function resolveEmails(
  decisionMakers: DecisionMaker[],
): Promise<Contact[]> {
  logger.stage(3, "Resolving work emails via Prospeo");

  const contacts: Contact[] = [];
  const seenEmails = new Set<string>();

  for (const person of decisionMakers) {
    const email = person.email;

    if (!email) {
      logger.warn(
        `No email for ${person.firstName} ${person.lastName} — skipping`,
      );
      continue;
    }

    if (seenEmails.has(email)) {
      logger.warn(`Duplicate skipped: ${email}`);
      continue;
    }

    seenEmails.add(email);
    contacts.push({
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      email,
      companyDomain: person.companyDomain,
    });

    logger.success(`Resolved: ${email}`);
  }

  logger.success(`Total verified contacts: ${contacts.length}`);
  return contacts;
}
