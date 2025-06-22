// src/router/modules/sm2Honeypot.ts
import type { RouteRecordRaw } from "vue-router";

const Layout = () => import("@/layout/index.vue");

const routes: RouteRecordRaw = {
  path: "/sm2-honeypot",
  component: Layout,
  redirect: "/sm2-honeypot/topology",
  name: "SM2Honeypot",
  meta: {
    title: "动态加密蜜罐系统",
    icon: "ep:connection",
    roles: ["admin"] // 根据实际权限调整
  },
  children: [
    {
      path: "topology",
      name: "Topology",
      component: () => import("@/views/sm2-honeypot/topology/index.vue"),
      meta: {
        title: "网络拓扑图",
        icon: "ep:set-up"
      }
    },
    {
      path: "config",
      name: "SM2Config",
      component: () => import("@/views/sm2-honeypot/config/index.vue"),
      meta: {
        title: "SM2加密配置",
        icon: "ep:lock"
      }
    },
    {
      path: "nodes",
      name: "HoneypotNodes",
      component: () => import("@/views/sm2-honeypot/nodes/index.vue"),
      meta: {
        title: "蜜罐节点管理",
        icon: "ep:cpu"
      }
    },
    {
      path: "attacks",
      name: "AttackLogs",
      component: () => import("@/views/sm2-honeypot/attacks/index.vue"),
      meta: {
        title: "攻击日志分析",
        icon: "ep:warning"
      }
    }
  ]
};

export default routes;