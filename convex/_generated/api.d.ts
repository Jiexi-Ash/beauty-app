/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as booking_actions from "../booking/actions.js";
import type * as booking_admin from "../booking/admin.js";
import type * as booking_public from "../booking/public.js";
import type * as booking_queries from "../booking/queries.js";
import type * as booking_user from "../booking/user.js";
import type * as business_actions from "../business/actions.js";
import type * as business_admin from "../business/admin.js";
import type * as business_public from "../business/public.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as notifications_messages from "../notifications/messages.js";
import type * as payfast from "../payfast.js";
import type * as payment from "../payment.js";
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
  "booking/actions": typeof booking_actions;
  "booking/admin": typeof booking_admin;
  "booking/public": typeof booking_public;
  "booking/queries": typeof booking_queries;
  "booking/user": typeof booking_user;
  "business/actions": typeof business_actions;
  "business/admin": typeof business_admin;
  "business/public": typeof business_public;
  crons: typeof crons;
  http: typeof http;
  "notifications/messages": typeof notifications_messages;
  payfast: typeof payfast;
  payment: typeof payment;
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
