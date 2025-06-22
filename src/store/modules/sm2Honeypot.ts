// src/store/modules/sm2Honeypot.ts
import { defineStore } from "pinia";

export const useHoneypotStore = defineStore("honeypot", {
  state: () => ({
    topology: {
      nodes: [] as any[],
      links: [] as any[]
    },
    sm2Config: {
      publicKey: "",
      privateKey: "",
      encryptionEnabled: false
    },
    recentAttacks: [] as any[]
  }),
  actions: {
    async fetchTopology() {
      // 模拟数据，实际应调用API
      this.topology = {
        nodes: [
          { id: 1, name: "防火墙", type: "firewall", status: "normal" },
          { id: 2, name: "蜜罐节点#1", type: "honeypot", status: "danger" }
        ],
        links: [{ source: 1, target: 2, protocol: "TCP" }]
      };
    },
    
    async generateSM2Keys() {
      // 模拟密钥生成
      this.sm2Config = {
        publicKey: "04" + Math.random().toString(36).substring(2, 66),
        privateKey: Math.random().toString(36).substring(2, 34),
        encryptionEnabled: true
      };
    },
    
    async fetchAttackLogs() {
      // 模拟攻击日志
      this.recentAttacks = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        time: new Date(Date.now() - i * 3600000).toISOString(),
        srcIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        type: ["端口扫描", "暴力破解", "SQL注入"][i % 3],
        target: `蜜罐节点#${(i % 3) + 1}`
      }));
    }
  }
});