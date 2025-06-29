<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>攻击源IP热力图分析</span>
        <div class="header-actions">
          <!-- 手动刷新按钮 -->
          <el-button
            type="success"
            plain
            :loading="loading"
            @click="fetchAllSessions"
          >
            更新实时数据
          </el-button>

          <!-- 视图切换按钮 -->
          <el-button type="primary" plain @click="toggleViewMode">
            {{ viewMode === "daily" ? "查看总图" : "查看每日" }}
          </el-button>
        </div>
      </div>
    </template>

    <!-- 日期选择器 - 只在每日视图显示 -->
    <div v-if="viewMode === 'daily'" class="filter-container">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        value-format="YYYY-MM-DD"
        @change="refreshData"
      />
    </div>

    <!-- 热力图容器 -->
    <div v-if="!noData" ref="heatmapChart" style="width: 100%; height: 600px" />

    <!-- 无数据提示 -->
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
import { getSessions } from "@/api/test";
import dayjs from "dayjs";

const heatmapChart = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

// 视图模式：daily-每日视图，overall-总览视图
const viewMode = ref<"daily" | "overall">("daily");
// 默认选择今天
const selectedDate = ref<string>(dayjs().format("YYYY-MM-DD"));
const allSessionData = ref<any[]>([]);
const noData = ref(false);
const loading = ref(false); // 加载状态

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === "daily" ? "overall" : "daily";
  refreshData();
};

// 获取所有会话数据
const fetchAllSessions = async () => {
  try {
    loading.value = true;
    noData.value = false;

    const response = await getSessions({
      page: 1,
      limit: 10000
    });

    if (response?.data) {
      allSessionData.value = response.data;
      refreshData();
    } else {
      noData.value = true;
    }
  } catch (error) {
    console.error("获取会话数据失败:", error);
    noData.value = true;
  } finally {
    loading.value = false;
  }
};

// 根据当前视图模式刷新数据
const refreshData = () => {
  if (viewMode.value === "daily") {
    filterDailyData();
  } else {
    prepareOverallData();
  }
};

// 每日视图：根据选定日期过滤数据
const filterDailyData = () => {
  if (!allSessionData.value.length) return;

  const filtered = allSessionData.value.filter(session => {
    const sessionDate = dayjs(session.starttime).format("YYYY-MM-DD");
    return sessionDate === selectedDate.value;
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

// 总览视图：准备所有数据
const prepareOverallData = () => {
  if (!allSessionData.value.length) {
    noData.value = true;
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    return;
  }

  noData.value = false;
  renderHeatmap(allSessionData.value, "攻击热力图 - 总览");
};

// 渲染热力图
const renderHeatmap = (data: any[], title: string) => {
  if (!chartInstance && heatmapChart.value) {
    chartInstance = echarts.init(heatmapChart.value);
  } else if (!chartInstance) {
    return;
  }

  // 1. 准备热力图数据
  const dataMap: Record<string, Record<number, number>> = {};

  // 统计每个IP在每个小时的攻击次数
  data.forEach(session => {
    const hour = dayjs(session.starttime).hour();
    const srcIp = session.src_ip;

    if (!srcIp) return; // 确保有源IP

    if (!dataMap[srcIp]) {
      dataMap[srcIp] = {};
    }

    if (!dataMap[srcIp][hour]) {
      dataMap[srcIp][hour] = 0;
    }

    dataMap[srcIp][hour]++;
  });

  // 2. 准备坐标轴数据
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const ips = Object.keys(dataMap);

  // 3. 准备热力图数据点
  const dataPoints: [number, number, number][] = [];

  ips.forEach((ip, ipIndex) => {
    for (let hour = 0; hour < 24; hour++) {
      const count = dataMap[ip][hour] || 0;
      dataPoints.push([hour, ipIndex, count]);
    }
  });

  // 4. 计算最大攻击次数
  const maxCount = Math.max(
    ...Object.values(dataMap)
      .flatMap(hourCounts => Object.values(hourCounts))
      .filter(Number.isFinite),
    1 // 确保最小值至少为1
  );

  // 5. 配置ECharts选项
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
      nameLocation: "end", // 将标题放在轴线的末端
      nameTextStyle: {
        padding: [0, 0, 0, 10] // 增加左侧内边距，避免与IP重叠
      },
      axisLabel: {
        formatter: (value: string) => {
          // 如果IP太长，截取部分显示
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
};

// 初始化图表
onMounted(() => {
  fetchAllSessions();

  // 窗口大小变化时重绘图表
  window.addEventListener("resize", () => {
    chartInstance?.resize();
  });
});

// 监听日期变化
watch(selectedDate, () => {
  if (viewMode.value === "daily") {
    refreshData();
  }
});

// 组件卸载时清理
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
