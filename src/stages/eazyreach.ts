import axios from "axios";
import { DecisionMaker, Contact } from "../types";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.superflow.run/b2b";

async function getAuthToken(): Promise<string> {
  const response = await axios.post(
    `${BASE_URL}/createAuthToken/`,
    {
      clientId: process.env.EAZYREACH_CLIENT_ID,
      clientSecret: process.env.EAZYREACH_CLIENT_SECRET,
    },
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return response.data.auth_token;
}

export async function resolveEmails(
  decisionMakers: DecisionMaker[],
): Promise<Contact[]> {
  logger.stage(3, "Resolving work emails via Eazyreach");

  let authToken: string;
  try {
    authToken = await getAuthToken();
    logger.success("Eazyreach auth token obtained");
  } catch (error: any) {
    logger.error(`Eazyreach auth failed: ${error.message}`);
    return [];
  }

  const contacts: Contact[] = [];
  const seenEmails = new Set<string>();

  for (const person of decisionMakers) {
    if (!person.linkedinUrl) {
      logger.warn(
        `No LinkedIn URL for ${person.firstName} ${person.lastName} — skipping`,
      );
      continue;
    }

    try {
      logger.info(
        `Resolving email for: ${person.firstName} ${person.lastName}`,
      );

      const response = await axios.post(
        `${BASE_URL}/linkedin-emails`,
        { linkedinUrl: person.linkedinUrl },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const emails: any[] = response.data.emails || [];
      const verified = emails.filter(
        (e) => e.verification === "verified" || e.verification === "probable",
      );

      if (verified.length === 0) {
        logger.warn(
          `No verified email for ${person.firstName} ${person.lastName}`,
        );
        continue;
      }

      const email = verified[0].email;

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

      await new Promise((r) => setTimeout(r, 1000));
    } catch (error: any) {
      if (error.response?.status === 402) {
        logger.warn(
          `Insufficient Eazyreach balance — skipping ${person.firstName}`,
        );
        continue;
      }
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
