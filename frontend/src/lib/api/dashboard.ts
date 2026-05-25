import { fetchWithAuth } from "../api";
import { AdminStats, TeacherStats, StudentStats } from "@/types/dashboard";

const BASE_URL = "/dashboard";

export async function getAdminStats(): Promise<AdminStats> {
  return fetchWithAuth<AdminStats>(`${BASE_URL}/admin/stats`);
}

export async function getTeacherStats(): Promise<TeacherStats> {
  return fetchWithAuth<TeacherStats>(`${BASE_URL}/enseignant/stats`);
}

export async function getStudentStats(): Promise<StudentStats> {
  return fetchWithAuth<StudentStats>(`${BASE_URL}/etudiant/stats`);
}
