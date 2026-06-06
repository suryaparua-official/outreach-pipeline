import axios from "axios";
import { Company } from "../types";
import { logger } from "../utils/logger";

const MAX_RETRIES = 3;

export async function findLookalikeCompanies(
  seedDomain: string,
): Promise<Company[]> {
  logger.stage(1, "Finding lookalike companies via Ocean.io");
  logger.info(`Seed domain: ${seedDomain}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `https://api.ocean.io/v3/search/companies`,
        {
          size: 10,
          companiesFilters: {
            lookalikeDomains: [seedDomain],
          },
        },
        {
          headers: {
            "X-Api-Token": process.env.OCEAN_API_KEY,
            "Content-Type": "application/json",
          },
        },
      );

      const companies: Company[] = [];
      (response.data.companies || []).forEach((c: any) => {
        const domain = c.domain || c.company?.domain;
        const name = c.name || c.company?.name;
        if (!domain) {
          return;
        }
        if (companies.some((existing) => existing.domain === domain)) {
          return;
        }
        companies.push({ domain, name });
      });

      logger.success(`Found ${companies.length} lookalike companies`);
      companies.forEach((c) => logger.dim(`  → ${c.domain}`));

      return companies;
    } catch (error: any) {
      if (error.response?.status === 429) {
        if (attempt < MAX_RETRIES) {
          const waitSec = attempt * 10;
          logger.warn(
            `Rate limit hit — attempt ${attempt}/${MAX_RETRIES}, waiting ${waitSec}s...`,
          );
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        } else {
          logger.error(
            `Ocean.io rate limit hit ${MAX_RETRIES} times — giving up.`,
          );
          return [];
        }
      }
      logger.error(
        `Ocean.io failed: ${error.response?.data?.detail || error.message}`,
      );
      return [];
    }
  }

  return [];
}
