import type { Expediente } from "@/lib/types";
import { hospitalLima } from "./hospital-lima";
import { plantaAgua, viaExpresa, colegioSanMartin } from "./otros-expedientes";

export const expedientes: Expediente[] = [hospitalLima, plantaAgua, viaExpresa, colegioSanMartin];

export function getExpedienteById(id: string): Expediente | undefined {
  return expedientes.find((e) => e.id === id);
}

export { hospitalLima, plantaAgua, viaExpresa, colegioSanMartin };
