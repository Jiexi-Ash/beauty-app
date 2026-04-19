/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as business_actions from "../business/actions.js";
import type * as business_admin from "../business/admin.js";
import type * as business_public from "../business/public.js";
import type * as http from "../http.js";
import type * as public_ from "../public.js";
import type * as seed from "../seed.js";
import type * as service_admin from "../service/admin.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "business/actions": typeof business_actions;
  "business/admin": typeof business_admin;
  "business/public": typeof business_public;
  http: typeof http;
  public: typeof public_;
  seed: typeof seed;
  "service/admin": typeof service_admin;
  users: typeof users;
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

export declare const components: {
  geospatial: import("@convex-dev/geospatial/_generated/component.js").ComponentApi<"geospatial">;
};
