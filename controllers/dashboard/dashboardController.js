// src/modules/dashboard/dashboardController.js
import { StatusCodes } from "http-status-codes";
import { candidates } from "#/schema/index.js";
import {
  getOverview,
  getVacancyRows,
  buildCompanyStats,
  buildPositionDistribution,
  countBy,
  getMonthlyTrend,
} from "./dashboardQueries.js";

export async function getDashboardController(req, res) {
  const [overview, vacancyRows, visa, medical, flight, byCountry, monthlyTrend] =
    await Promise.all([
      getOverview(),
      getVacancyRows(),
      countBy(candidates.visaStatus),
      countBy(candidates.medicalStatus),
      countBy(candidates.flightStatus),
      countBy(candidates.appliedCountry),
      getMonthlyTrend(6),
    ]);

  const openRows = vacancyRows.filter((v) => v.status === "open");

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Dashboard fetched successfully",
    item: {
      overview: {
        ...overview,
        openVacancies: openRows.length,
        totalOpenings: openRows.reduce((sum, v) => sum + v.openings, 0),
        fulfilledVacancies: vacancyRows.filter(
          (v) => v.openings > 0 && v.selected >= v.openings
        ).length,
      },
      companies: buildCompanyStats(vacancyRows),
      positionDistribution: buildPositionDistribution(
        vacancyRows,
        overview.unassignedCandidates
      ),
      pipeline: { visa, medical, flight },
      byCountry,
      monthlyTrend,
    },
  });
}
