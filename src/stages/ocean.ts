import axios from "axios";
import { Company } from "../types.ts";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.ocean.io/v1";

export async function findLookalikeCompanies(
  seedDomain: string,
): Promise<Company[]> {
  logger.stage(1, "Finding lookalike companies via Ocean.io");
  logger.info(`Seed domain: ${seedDomain}`);

  try {
    const response = await axios.post(
      `${BASE_URL}/lookalikes`,
      {
        domain: seedDomain,
        limit: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OCEAN_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const companies: Company[] = response.data.companies.map((c: any) => ({
      domain: c.domain,
      name: c.name,
    }));

    logger.success(`Found ${companies.length} lookalike companies`);
    companies.forEach((c) => logger.dim(`  → ${c.domain}`));

    return companies;
  } catch (error: any) {
    if (error.response?.status === 429) {
      logger.warn("Rate limit hit on Ocean.io — waiting 10s...");
      await new Promise((r) => setTimeout(r, 10000));
      return findLookalikeCompanies(seedDomain);
    }
    logger.error(`Ocean.io failed: ${error.message}`);
    return [];
  }
}
