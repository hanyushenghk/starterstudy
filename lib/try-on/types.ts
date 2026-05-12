export type GarmentCategory = "upper_body" | "lower_body" | "dresses";

export type TryOnPhase =
  | "idle"
  | "detecting"
  | "ready"
  | "generating"
  | "success"
  | "error";

export type TryOnMode = "live" | "placeholder";
