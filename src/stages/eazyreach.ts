import axios from "axios";
import { DecisionMaker, Contact } from "../types.ts";
import { logger } from "../utils/logger";

const BASE_URL = "https://app.eazyreach.com/api";

export async function resolveEmails(
  decisionMakers: DecisionMaker[],
): Promise<Contact[]> {
  logger.stage(3, "Resolving work emails via Eazyreach");

  const contacts: Contact[] = [];
  const seenEmails = new Set<string>();

  for (const person of decisionMakers) {
    try {
      logger.info(
        `Resolving email for: ${person.firstName} ${person.lastName}`,
      );

      const response = await axios.post(
        `${BASE_URL}/email-finder`,
        {
          linkedin_url: person.linkedinUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.EAZYREACH_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      const email = response.data.email;

      if (!email) {
        logger.warn(
          `No email found for ${person.firstName} ${person.lastName}`,
        );
        continue;
      }

      if (seenEmails.has(email)) {
        logger.warn(`Duplicate email skipped: ${email}`);
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

      // avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Rate limit hit — waiting 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      logger.error(
        `Eazyreach failed for ${person.firstName}: ${error.message}`,
      );
    }
  }

  logger.success(`Total verified contacts: ${contacts.length}`);
  return contacts;
}
