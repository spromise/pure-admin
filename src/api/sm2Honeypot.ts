// src/api/sm2Honeypot.ts
import { http } from "@/utils/http";

// 获取网络拓扑
export const getTopology = () => {
  return http.request("get", "/api/sm2-honeypot/topology");
};

// 生成SM2密钥对
export const generateSM2Keys = () => {
  return http.request("post", "/api/sm2-honeypot/generate-keys");
};

// 获取攻击日志
export const getAttackLogs = (params?: any) => {
  return http.request("get", "/api/sm2-honeypot/attack-logs", { params });
};