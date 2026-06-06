import axios from "axios";
import { Company, DecisionMaker } from "../types.ts";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.prospeo.io";

export async function findDecisionMakers(
  companies: Company[],
): Promise<DecisionMaker[]> {
  logger.stage(2, "Finding decision makers via Prospeo");

  const allDecisionMakers: DecisionMaker[] = [];

  for (const company of companies) {
    try {
      logger.info(`Searching decision makers for: ${company.domain}`);

      const response = await axios.post(
        `${BASE_URL}/domain-search`,
        {
          domain: company.domain,
          limit: 5,
        },
        {
          headers: {
            "X-KEY": process.env.PROSPEO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      const makers: DecisionMaker[] = response.data.response
        .filter((p: any) =>
          ["c-suite", "vp", "director", "head"].some((role) =>
            p.job_title?.toLowerCase().includes(role),
          ),
        )
        .map((p: any) => ({
          firstName: p.first_name,
          lastName: p.last_name,
          title: p.job_title,
          linkedinUrl: p.linkedin_url,
          companyDomain: company.domain,
        }));

      logger.success(
        `Found ${makers.length} decision makers at ${company.domain}`,
      );
      allDecisionMakers.push(...makers);

      // avoid rate limiting
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Rate limit hit for ${company.domain} — skipping`);
        continue;
      }
      logger.error(`Prospeo failed for ${company.domain}: ${error.message}`);
    }
  }

  logger.success(`Total decision makers found: ${allDecisionMakers.length}`);
  return allDecisionMakers;
}
