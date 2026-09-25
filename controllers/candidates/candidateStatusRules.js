// src/modules/candidates/candidateStatusRules.js

// field on `candidates` -> which roles to notify, and how to phrase it
export const STATUS_FIELD_RULES = {
  offerStatus: { roles: ["recruiter", "admin"], label: "Offer status" },
  medicalStatus: { roles: ["medical_team", "admin"], label: "Medical status" },
  molStatus: { roles: ["visa_team", "admin"], label: "MOL status" },
  tashreehStatus: { roles: ["visa_team", "admin"], label: "Tashreeh status" },
  visaStatus: { roles: ["visa_team", "recruiter", "admin"], label: "Visa status" },
  qvcStatus: { roles: ["visa_team", "admin"], label: "QVC status" },
  mofaStatus: { roles: ["visa_team", "admin"], label: "MOFA status" },
  pccStatus: { roles: ["visa_team", "admin"], label: "PCC status" },
  dofeStatus: { roles: ["visa_team", "admin"], label: "DOFE status" },
  ppStatus: { roles: ["visa_team", "admin"], label: "PP status" },
  flightStatus: { roles: ["deployment_team", "recruiter", "admin"], label: "Flight status" },
};

export const STATUS_COLUMNS = Object.keys(STATUS_FIELD_RULES);
