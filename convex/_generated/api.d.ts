/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as documents from "../documents.js";
import type * as fields from "../fields.js";
import type * as highlights from "../highlights.js";
import type * as http from "../http.js";
import type * as lines from "../lines.js";
import type * as messages from "../messages.js";
import type * as recipients from "../recipients.js";
import type * as signatures from "../signatures.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  documents: typeof documents;
  fields: typeof fields;
  highlights: typeof highlights;
  http: typeof http;
  lines: typeof lines;
  messages: typeof messages;
  recipients: typeof recipients;
  signatures: typeof signatures;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
