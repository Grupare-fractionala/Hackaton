export const DEPARTMENT_TECHNICAL = "Tehnic";
export const DEPARTMENT_HR = "HR";
export const DEPARTMENT_ADMINISTRATIVE = "Administrativ";

export const TICKET_DEPARTMENTS = [
  DEPARTMENT_TECHNICAL,
  DEPARTMENT_HR,
  DEPARTMENT_ADMINISTRATIVE,
];

export function getAssignedDepartmentByCategory(category) {
  const normalized = String(category || "").trim().toLowerCase();

  if (normalized.includes("tehnic") || normalized === "it") {
    return DEPARTMENT_TECHNICAL;
  }

  if (normalized === "hr" || normalized.includes("resurse")) {
    return DEPARTMENT_HR;
  }

  return DEPARTMENT_ADMINISTRATIVE;
}
