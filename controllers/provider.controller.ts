import { providerService } from "@/services/provider.service";
import { SearchParams } from "next/dist/server/request/search-params";
import { NextRequest } from "next/server";

const getProvider = async (req: NextRequest) => {
  const url = req.url;
  return providerService.getProviders(url);
};

const providerStatus = async (providerId: string) => {
  if (!providerId) throw new Error("provider id not found");

  return await providerService.providerReviewState(providerId);
};

const getProviderById = async (id: string) => {
  if (!id) throw new Error("provider id not found");

  return await providerService.getProviderById(id);
};

const providerProducts = async (
  id: string,
  limit: number,
  showAll: boolean,
  page: number,
) => {
  if (!id) throw new Error("provider id not found");

  return await providerService.getProviderProducts(id, showAll, limit, page);
};

type ProviderRelations = {
  provider?: boolean;
  actor?: boolean;
  resolver?: boolean;
};

async function getProviderAccess(providerId: string, rStr?: string) {
  if (!providerId) {
    throw new Error("Missing Provider Id");
  }

  const allowedRelations = ["provider", "actor", "resolver"] as const;

  const relation: ProviderRelations | undefined = rStr
    ? rStr.split(",").reduce<ProviderRelations>((acc, value) => {
        const key = value.trim();

        if (
          allowedRelations.includes(key as (typeof allowedRelations)[number])
        ) {
          acc[key as keyof ProviderRelations] = true;
        }

        return acc;
      }, {})
    : undefined;

  return await providerService.getProviderStatusLog(providerId, relation);
}

export const providerController = {
  getProvider,
  providerStatus,
  getProviderById,
  providerProducts,
  getProviderAccess,
};
