export const isNonEmptyString = (v: unknown): v is string =>
	typeof v === "string" && v.trim().length > 0;

export const isStringArray = (v: unknown): v is string[] =>
	Array.isArray(v) && v.every((x) => typeof x === "string");

export const isValidDate = (v: unknown): v is string => {
	if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
	return new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
};
