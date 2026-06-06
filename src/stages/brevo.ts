import axios from "axios";
import { Contact } from "../types.ts";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.brevo.com/v3";

function buildEmailBody(contact: Contact): string {
  return `Hi ${contact.firstName},

I noticed ${contact.companyDomain} and thought there might be a genuine fit worth exploring.

We help companies like yours automate their sales outreach — from finding the right decision-makers to sending personalized emails at scale, all without manual effort.

Most teams we work with were spending hours each week on prospecting. We cut that to zero.

Here's what we do in short:
- Identify lookalike companies from your best customers
- Surface C-suite and VP-level contacts automatically
- Verify work emails so nothing bounces
- Send personalized outreach on your behalf

Would it make sense to hop on a quick 15-minute call this week to see if this could work for ${contact.companyDomain}?

Best,
Surya Parua
Vocallabs / SubSpace Growth Team`;
}

export async function sendOutreachEmails(contacts: Contact[]): Promise<number> {
  logger.stage(4, "Sending outreach emails via Brevo");

  let sent = 0;

  for (const contact of contacts) {
    try {
      await axios.post(
        `${BASE_URL}/smtp/email`,
        {
          sender: {
            name: "Surya Parua",
            email: process.env.SENDER_EMAIL,
          },
          to: [
            {
              email: contact.email,
              name: `${contact.firstName} ${contact.lastName}`,
            },
          ],
          subject: `Quick note — ${contact.companyDomain}`,
          textContent: buildEmailBody(contact),
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      logger.success(`Email sent to ${contact.email}`);
      sent++;

      await new Promise((r) => setTimeout(r, 500));
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Rate limit hit — waiting 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      logger.error(`Failed to send to ${contact.email}: ${error.message}`);
    }
  }

  logger.success(`Total emails sent: ${sent}`);
  return sent;
}
