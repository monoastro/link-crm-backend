import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { vacancies } from "./vacancies.js";
import { pkid, timestamps } from "./helpers.js";

export const genderEnum = t.pgEnum("gender", ["male", "female", "other"]);

export const candidates = t.pgTable(
  "candidates",
  {
    ...pkid,
    ...timestamps,

    name: t.varchar("name", { length: 255 }).notNull(),
    email: t.varchar("email", { length: 255 }),
    phone: t.varchar("phone", { length: 20 }),
    passportNumber: t.varchar("passport", { length: 20 }).unique().notNull(),
    address: t.varchar("address", { length: 255 }),
    dob: t.date("dob"),
    gender: genderEnum("gender"),
    isSelected: t.boolean("is_selected").default(false),

    appliedCategory: t.uuid("applied_category").references(() => vacancies.id, { onDelete: "set null" }),
    passportExpiry: t.date("passport_expiry"),
    placeOfBirth: t.varchar("place_of_birth", { length: 255 }),
    docsForwardOrInterviewDate: t.timestamp("docs_forward_or_interview_date"),
    offerStatus: t.varchar("offer_status", { length: 255 }),
    medicalStatus: t.varchar("medical_status", { length: 255 }),
    molStatus: t.varchar("mol_status", { length: 255 }),
    tashreehStatus: t.varchar("tashreeh_status", { length: 255 }),
    visaNumber: t.varchar("visa_number", { length: 50 }),
    visaStatus: t.varchar("visa_status", { length: 255 }),
    visaRemarks: t.text("visa_remarks"),
    qvcStatus: t.varchar("qvc_status", { length: 255 }),
    mofaStatus: t.varchar("mofa_status", { length: 255 }),
    pccStatus: t.varchar("pcc_status", { length: 255 }),
    visaProfession: t.varchar("visa_profession", { length: 255 }),
    appliedCountry: t.varchar("applied_country", { length: 255 }),
    companyId: t
      .uuid("company_id")
      .references(() => companies.id, { onDelete: "set null" }),
    month: t.varchar("month", { length: 50 }),
    visaReceivedDate: t.date("visa_received_date"),
    visaExpiryDate: t.date("visa_expiry_date"),
    dofeStatus: t.varchar("dofe_status", { length: 255 }),
    ppStatus: t.varchar("pp_status", { length: 255 }),
    deploymentOn: t.date("deployment_on"),
    flightStatus: t.varchar("flight_status", { length: 255 }),
    reference: t.varchar("reference", { length: 255 }),
    remarks: t.text("remarks"),
  },
  (table) => [
    t.check("name_length_check", sql`length(trim(${table.name})) >= 2`),
  ],
);

