import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { pkid, timestamps } from "./helpers.js";
import { candidates } from "./candidates.js";

export const documentTypeEnum = t.pgEnum("document_type", [
  "passport",
  "visa",
  "id_card",
  "driving_license",
  "citizenship",
  "residence_permit",
  "other",
  "land_ownership_certificate",
  "photo",
  "national_id",
]);

export const fileTypeEnum = t.pgEnum("file_type", [
  "pdf",
  "docx",
  "image",
]);

export const documents = t.pgTable(
  "documents",
  {
    ...pkid,
    ...timestamps,

    candidateId: t.uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),

    type: documentTypeEnum("type").notNull(),
    fileType: fileTypeEnum("file_type").notNull(),
    url: t.text("url").notNull(),
  },
);
