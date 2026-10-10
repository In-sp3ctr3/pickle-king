/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_authz from "../lib/authz.js";
import type * as lib_authz_policy from "../lib/authz_policy.js";
import type * as schema_identity from "../schema_identity.js";
import type * as schema_match from "../schema_match.js";
import type * as schema_operations from "../schema_operations.js";
import type * as schema_tournament from "../schema_tournament.js";
import type * as schema_values from "../schema_values.js";
import type * as status from "../status.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/authz": typeof lib_authz;
  "lib/authz_policy": typeof lib_authz_policy;
  schema_identity: typeof schema_identity;
  schema_match: typeof schema_match;
  schema_operations: typeof schema_operations;
  schema_tournament: typeof schema_tournament;
  schema_values: typeof schema_values;
  status: typeof status;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
