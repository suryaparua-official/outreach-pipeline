import axios from "axios";
import { Contact } from "../types";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.brevo.com/v3";

function companyName(domain: string): string {
  return domain
    .replace(/^www\./, "")
    .replace(/\.(com|ai|io|co|net|org|in).*$/, "")
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildEmailBody(contact: Contact): string {
  const company = companyName(contact.companyDomain);
  return `Hi ${contact.firstName},

I came across ${company} while researching high-growth teams in the AI space — looks like you're building something interesting.

I'm reaching out because we built an outreach system that does in seconds what most sales teams spend hours on each week — finding decision-makers, verifying emails, and sending personalized messages, fully automated.

Given your role as ${contact.title} at ${company}, I thought this could directly impact how your team handles prospecting.

Would you be open to a 15-minute call this week? Happy to show you a live demo.

Best,
Surya Parua
Vocallabs / SubSpace
surya.exce@gmail.com`;
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
          subject: `Quick question for you, ${contact.firstName}`,
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