import { defineSchema } from "convex/server";
import { identityTables } from "./schema_identity";
import { matchTables } from "./schema_match";
import { operationTables } from "./schema_operations";
import { tournamentTables } from "./schema_tournament";

export default defineSchema({
  ...identityTables,
  ...tournamentTables,
  ...matchTables,
  ...operationTables,
});
