import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  handleServerError(error) {
    console.error("Action error:", error);
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred.";
  },
});

export const authedActionClient = actionClient;
