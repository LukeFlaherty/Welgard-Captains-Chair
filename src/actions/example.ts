"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export const exampleAction = actionClient
  .metadata({ actionName: "exampleAction" })
  .schema(schema)
  .action(async ({ parsedInput }) => {
    return { message: `Hello, ${parsedInput.name}!` };
  });
