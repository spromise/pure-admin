// src/api/sm2Honeypot.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

// 获取authentication
export const getAuth = () => {
  return http.request<any>("get", baseUrlApi("auth"));
};