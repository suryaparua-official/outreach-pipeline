import axios from "axios";
import { Company } from "../types";
import { logger } from "../utils/logger";

export async function findLookalikeCompanies(
  seedDomain: string,
): Promise<Company[]> {
  logger.stage(1, "Finding lookalike companies via Ocean.io");
  logger.info(`Seed domain: ${seedDomain}`);

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

    const companies: Company[] = (response.data.companies || []).map(
      (c: any) => ({
        domain: c.domain || c.company?.domain,
        name: c.name || c.company?.name,
      }),
    );

    logger.success(`Found ${companies.length} lookalike companies`);
    companies.forEach((c) => logger.dim(`  → ${c.domain}`));

    return companies;
  } catch (error: any) {
    if (error.response?.status === 429) {
      logger.warn("Rate limit hit — waiting 10s...");
      await new Promise((r) => setTimeout(r, 10000));
      return findLookalikeCompanies(seedDomain);
    }
    logger.error(
      `Ocean.io failed: ${error.response?.data?.detail || error.message}`,
    );
    return [];
  }
}
