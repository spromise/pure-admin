<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>流量折线图</span>
      </div>
    </template>
    <div class="chart-container">
      <div ref="chartRef" class="chart" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import * as echarts from "echarts";

defineOptions({
  name: "TrafficChart"
});

const router = useRouter();
const chartRef = ref<HTMLElement>();

onMounted(() => {
  if (!chartRef.value) return;

  // 初始化图表
  const myChart = echarts.init(chartRef.value);

  // 图表配置
  const option = {
    title: {
      text: "流量趋势图"
    },
    tooltip: {},
    legend: {
      data: ["流量"]
    },
    xAxis: {
      data: ["1", "2", "3", "4", "5", "6"]
    },
    yAxis: {},
    series: [
      {
        name: "流量",
        type: "line",
        data: [150, 230, 224, 218, 135, 147]
      }
    ]
  };

  // 应用配置
  myChart.setOption(option);

  // 响应式调整
  window.addEventListener("resize", () => {
    myChart.resize();
  });
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
