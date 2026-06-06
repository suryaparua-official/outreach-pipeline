import axios from "axios";
import { Company } from "../types.ts";
import { logger } from "../utils/logger";

const BASE_URL = "https://api.ocean.io/v1";
const MAX_RETRIES = 3;

export async function findLookalikeCompanies(
  seedDomain: string,
): Promise<Company[]> {
  logger.stage(1, "Finding lookalike companies via Ocean.io");
  logger.info(`Seed domain: ${seedDomain}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
        if (attempt < MAX_RETRIES) {
          const waitSec = attempt * 10;
          logger.warn(
            `Rate limit hit on Ocean.io — attempt ${attempt}/${MAX_RETRIES}, waiting ${waitSec}s...`,
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
      logger.error(`Ocean.io failed: ${error.message}`);
      return [];
    }
  }

  return [];
}
