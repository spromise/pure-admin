// src/api/sm2Honeypot.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

// 获取authentication
export const getAuth = () => {
  return http.request("get", baseUrlApi("auth"));
};

// 获取 sessions
export const getSessions = () => {
  return http.request("get", baseUrlApi("sessions"));
};