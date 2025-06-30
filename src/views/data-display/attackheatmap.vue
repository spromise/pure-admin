<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>攻击日志热力图分析</span>
        <div class="header-actions">
          <el-button
            type="success"
            plain
            :loading="loading"
            @click="fetchAllLogs"
          >
            更新日志
          </el-button>
          <el-button type="primary" plain @click="toggleViewMode">
            {{ viewMode === "daily" ? "查看总图" : "查看每日" }}
          </el-button>
        </div>
      </div>
    </template>
    <div v-if="viewMode === 'daily'" class="filter-container">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        @change="refreshData"
      />
    </div>
    <div v-if="!noData" ref="heatmapChart" style="width: 100%; height: 600px" />
    <el-empty
      v-if="noData"
      :description="
        viewMode === 'daily' ? '所选日期没有攻击数据' : '没有攻击数据'
      "
      style="margin-top: 20px"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import { getAttackLogs } from "@/api/test";
import dayjs from "dayjs";

const heatmapChart = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const viewMode = ref<"daily" | "overall">("daily");
const selectedDate = ref<string>(dayjs().format("YYYY-MM-DD"));
const allLogs = ref<any[]>([]);
const noData = ref(false);
const loading = ref(false);

const toggleViewMode = () => {
  viewMode.value = viewMode.value === "daily" ? "overall" : "daily";
  refreshData();
};

const fetchAllLogs = async () => {
  try {
    loading.value = true;
    noData.value = false;
    const res = await getAttackLogs();
    if (res?.data) {
      allLogs.value = res.data;
      refreshData();
    } else {
      noData.value = true;
    }
  } catch (error) {
    console.error("获取攻击日志失败:", error);
    noData.value = true;
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  if (viewMode.value === "daily") {
    filterDailyData();
  } else {
    prepareOverallData();
  }
};

const filterDailyData = () => {
  if (!allLogs.value.length) return;
  const filtered = allLogs.value.filter(log => {
    const date = dayjs(log.processed_at || log.timestamp_parsed).format(
      "YYYY-MM-DD"
    );
    return date === selectedDate.value;
  });
  if (filtered.length === 0) {
    noData.value = true;
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  } else {
    noData.value = false;
    renderHeatmap(filtered, `攻击热力图 - ${selectedDate.value}`);
  }
};

const prepareOverallData = () => {
  if (!allLogs.value.length) {
    noData.value = true;
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    return;
  }
  noData.value = false;
  renderHeatmap(allLogs.value, "攻击热力图 - 总览");
};

function renderHeatmap(logs: any[], title: string) {
  if (!chartInstance && heatmapChart.value) {
    chartInstance = echarts.init(heatmapChart.value);
  } else if (!chartInstance) {
    return;
  }
  // 1. 统计每个IP在每个小时的攻击次数
  const dataMap: Record<string, Record<number, number>> = {};
  logs.forEach(item => {
    const hour = dayjs(item.processed_at || item.timestamp_parsed).hour();
    const srcIp = item.peer?.ip || "未知";
    if (!dataMap[srcIp]) dataMap[srcIp] = {};
    if (!dataMap[srcIp][hour]) dataMap[srcIp][hour] = 0;
    dataMap[srcIp][hour]++;
  });
  // 2. 坐标轴数据
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const ips = Object.keys(dataMap);
  // 3. 热力图数据点
  const dataPoints: [number, number, number][] = [];
  ips.forEach((ip, ipIndex) => {
    for (let hour = 0; hour < 24; hour++) {
      const count = dataMap[ip][hour] || 0;
      dataPoints.push([hour, ipIndex, count]);
    }
  });
  // 4. 最大攻击次数
  const maxCount = Math.max(
    ...Object.values(dataMap)
      .flatMap(hourCounts => Object.values(hourCounts))
      .filter(Number.isFinite),
    1
  );
  // 5. ECharts 配置
  const option: echarts.EChartsOption = {
    title: {
      text: title,
      left: "center",
      top: 10
    },
    tooltip: {
      position: "top",
      formatter: (params: any) => {
        const value = params.value as [number, number, number];
        const hour = value[0];
        const ip = ips[value[1]];
        const count = value[2];
        return `
          <strong>${ip}</strong><br/>
          时间: ${hour}:00 - ${hour + 1}:00<br/>
          攻击次数: <b style="color:red">${count}</b>
        `;
      }
    },
    grid: {
      top: 70,
      left: 100,
      right: 100,
      bottom: 50
    },
    xAxis: {
      type: "category",
      data: hours,
      axisLabel: {
        interval: 0,
        rotate: 45
      },
      name: "时间 (小时)",
      nameLocation: "middle",
      nameGap: 30
    },
    yAxis: {
      type: "category",
      data: ips,
      name: "攻击源IP",
      nameLocation: "end",
      nameTextStyle: {
        padding: [0, 0, 0, 10]
      },
      axisLabel: {
        formatter: (value: string) => {
          if (value.length > 15) {
            return value.substring(0, 12) + "...";
          }
          return value;
        }
      }
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: "vertical",
      right: 30,
      top: "center",
      inRange: {
        color: ["#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"]
      },
      textStyle: {
        color: "#333"
      }
    },
    series: [
      {
        name: "攻击次数",
        type: "heatmap",
        data: dataPoints,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const count = params.value[2];
            return count > 0 ? count : "";
          }
        }
      }
    ]
  };
  chartInstance.setOption(option);
}

onMounted(() => {
  fetchAllLogs();
  window.addEventListener("resize", () => {
    chartInstance?.resize();
  });
});

watch(selectedDate, () => {
  if (viewMode.value === "daily") {
    refreshData();
  }
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener("resize", () => {
    chartInstance?.resize();
  });
});
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
</style>
