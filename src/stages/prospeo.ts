import axios from "axios";
import { Company, DecisionMaker } from "../types";
import { logger } from "../utils/logger";

export async function findDecisionMakers(
  companies: Company[],
): Promise<DecisionMaker[]> {
  logger.stage(2, "Finding decision makers via Prospeo");

  const allDecisionMakers: DecisionMaker[] = [];

  for (const company of companies) {
    try {
      logger.info(`Searching decision makers for: ${company.domain}`);

      const response = await axios.post(
        `https://api.prospeo.io/search-person`,
        {
          page: 1,
          filters: {
            company: {
              websites: {
                include: [company.domain],
              },
            },
            person_seniority: {
              include: [
                "Founder/Owner",
                "C-Suite",
                "Vice President",
                "Director",
              ],
            },
          },
        },
        {
          headers: {
            "X-KEY": process.env.PROSPEO_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.error) {
        logger.warn(
          `No results for ${company.domain}: ${response.data.error_code}`,
        );
        continue;
      }

      const results = response.data.results || [];

      const makers: DecisionMaker[] = results
        .map((r: any) => {
          const p = r.person;
          return {
            firstName: p?.first_name || "",
            lastName: p?.last_name || "",
            title: p?.current_job_title || "",
            linkedinUrl: p?.linkedin_url || "",
            companyDomain: company.domain,
            personId: p?.person_id || "",
            email: p?.email?.email || "",
          };
        })
        .filter((m: any) => m.firstName && m.linkedinUrl);

      logger.success(
        `Found ${makers.length} decision makers at ${company.domain}`,
      );
      allDecisionMakers.push(...makers);

      await new Promise((r) => setTimeout(r, 1000));
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Rate limit hit — waiting 5s...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      logger.error(
        `Prospeo failed for ${company.domain}: ${JSON.stringify(error.response?.data) || error.message}`,
      );
    }
  }

  logger.success(`Total decision makers found: ${allDecisionMakers.length}`);
  return allDecisionMakers;
}
