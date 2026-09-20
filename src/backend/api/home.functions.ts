import { createServerFn } from "@tanstack/react-start";
import { getFeedPage, getHomeFeed } from "../services/feedService";
import { CURRENT_USER_ID } from "../database/seed";

export const fetchHome = createServerFn({ method: "GET" })
  .inputValidator((data: { cursor?: string | null } | undefined) => ({
    cursor: data?.cursor ?? null,
  }))
  .handler(async ({ data }) => getHomeFeed(data.cursor));

export const fetchFeedPage = createServerFn({ method: "GET" })
  .inputValidator((data: { cursor?: string | null } | undefined) => ({
    cursor: data?.cursor ?? null,
  }))
  .handler(async ({ data }) => getFeedPage(CURRENT_USER_ID, data.cursor));
