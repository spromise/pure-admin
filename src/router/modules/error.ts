export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri/information-line",
    // showLink: false,
    title: "异常页面",
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "403"
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "404"
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: "500"
      }
    }
  ]
} satisfies RouteConfigsTable;

export const dataDisplay = {
  path: "/data-display",
  redirect: "/data-display/traffic",
  meta: {
    icon: "ri/information-fill",
    title: "数据展示",
    rank: 10
  },
  children: [
    {
      path: "/data-display/3",
      name: "DataDisplay3",
      component: () => import("@/views/data-display/3.vue"),
      meta: {
        title: "SSH会话数据"
      }
    },
    {
      path: "/data-display/heatmap",
      name: "AttackHeatmap",
      component: () => import("@/views/data-display/heatmap.vue"),
      meta: {
        title: "SSH攻击热力图"
      }
    },
    {
      path: "/data-display/2",
      name: "DataDisplay2",
      component: () => import("@/views/data-display/2.vue"),
      meta: {
        title: "SSH认证数据"
      }
    },

    {
      path: "/data-display/graph",
      name: "AuthRelationGraph",
      component: () => import("@/views/data-display/graph.vue"),
      meta: {
        title: "SSH认证关系图",
        icon: "ri/node-tree"
      }
    },
    {
      path: "/data-display/attacklog",
      name: "attacklog",
      component: () => import("@/views/data-display/attacklog.vue"),
      meta: {
        title: "Web攻击日志"
      }
    },
    {
      path: "/data-display/attheatmap",
      name: "attacklogheatmap",
      component: () => import("@/views/data-display/attackheatmap.vue"),
      meta: {
        title: "Web攻击热力图"
      }
    }
  ]
} satisfies RouteConfigsTable;
