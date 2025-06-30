// src/api/sm2Honeypot.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

// 获取authentication - 修复参数传递
export const getAuth = (params?: {
  page?: number;
  limit?: number;
  username?: string;
  src_ip?: string;
}) => {
  return http.request("get", baseUrlApi("auth"), { params });
};

// 获取 sessions
type SessionsResult = {
  success: boolean;
  data: Array<{
    id: string;
    starttime: string;
    src_ip: string;
    // 其他可能的字段
  }>;
};

export const getSessions = (params?: { page?: number; limit?: number }) => {
  return http.request<SessionsResult>("get", baseUrlApi("sessions"), {
    params
  });
};

// src/api/test.ts
export const getHeatmapData = (params?: { date?: string }) => {
  return http.request("get", baseUrlApi("heatmap-data"), { params });
};

// src/api/test.ts
export const getAttackLogs = (params?: { date?: string }) => {
  return http.request("get", baseUrlApi("attacklog"), { params });
};
