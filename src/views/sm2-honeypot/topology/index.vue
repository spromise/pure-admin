<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium">网络拓扑图</span>
          <div>
            <el-button type="primary" @click="refreshTopology">
              <el-icon><Refresh /></el-icon>刷新拓扑
            </el-button>
            <el-button class="ml-2" @click="addHoneypot">
              <el-icon><Plus /></el-icon>添加蜜罐节点
            </el-button>
          </div>
        </div>
      </template>

      <div ref="topologyChart" class="h-[600px] w-full"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as echarts from "echarts";
import { Refresh, Plus } from "@element-plus/icons-vue";
import { useHoneypotStore } from "@/store/modules/sm2Honeypot";

const honeypotStore = useHoneypotStore();
const topologyChart = ref<HTMLElement>();

onMounted(() => {
  honeypotStore.fetchTopology();
  renderTopology();
});

const refreshTopology = () => {
  honeypotStore.fetchTopology().then(() => {
    renderTopology();
  });
};

const addHoneypot = () => {
  const newId = Math.max(...honeypotStore.topology.nodes.map(n => n.id)) + 1;
  honeypotStore.topology.nodes.push({
    id: newId,
    name: `蜜罐节点#${newId}`,
    type: "honeypot",
    status: "normal"
  });
  renderTopology();
};

const renderTopology = () => {
  if (!topologyChart.value) return;
  
  const chart = echarts.init(topologyChart.value);
  const option = {
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === "node") {
          return `${params.data.name}<br/>状态: ${params.data.status}`;
        }
        return `连接: ${params.data.source} → ${params.data.target}`;
      }
    },
    series: [
      {
        type: "graph",
        layout: "force",
        roam: true,
        label: { 
          show: true,
          formatter: "{b}"
        },
        data: honeypotStore.topology.nodes.map(node => ({
          ...node,
          symbolSize: 50,
          itemStyle: {
            color: node.status === "danger" ? "#F56C6C" : 
                   node.status === "warning" ? "#E6A23C" : "#67C23A"
          }
        })),
        links: honeypotStore.topology.links,
        lineStyle: { width: 2, curveness: 0.2 },
        force: {
          repulsion: 200,
          gravity: 0.1
        }
      }
    ]
  };
  
  chart.setOption(option);
  
  // 监听点击事件
  chart.on("click", (params: any) => {
    if (params.dataType === "node") {
      console.log("点击节点:", params.data);
      // 这里可以添加节点管理逻辑
    }
  });
};
</script>

<style scoped>
.node {
  cursor: pointer;
  transition: transform 0.3s;
}
.node:hover {
  transform: scale(1.1);
}
</style>