<script setup lang="ts">
import { ref, markRaw, onMounted, nextTick } from "vue";
import { getAttackLogs, getSessions, getAuth } from "@/api/test";
import {
  ElCard,
  ElStatistic,
  ElRow,
  ElCol,
  ElProgress,
  ElTimeline,
  ElTimelineItem,
  ElScrollbar
} from "element-plus";
import {
  WarningFilled,
  DataLine,
  Histogram,
  PieChart
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import type { AxiosResponse } from "axios";

// 统计数据
const totalAttacks = ref(0);
const uniqueIps = ref(0);
const latestAttack = ref("-");
const latestAttackerIp = ref("-");
const attackCategoryMap = ref<Record<string, number>>({});
const progressData = ref<
  { week: string; percentage: number; color: string; duration: number }[]
>([]);
const latestNewsData = ref<
  { date: string; requiredNumber: number; resolveNumber: number }[]
>([]);
const hourChartRef = ref<HTMLDivElement>();
const radarChartRef = ref<HTMLDivElement>();
const scatterChartRef = ref<HTMLDivElement>();
const gaugeChartRef = ref<HTMLDivElement>();
let hourChart: echarts.ECharts | null = null;
let radarChart: echarts.ECharts | null = null;
let scatterChart: echarts.ECharts | null = null;
let gaugeChart: echarts.ECharts | null = null;

// 渲染小时柱状图
function renderHourChart(hourData: number[]) {
  if (!hourChartRef.value) return;
  if (!hourChart) hourChart = echarts.init(hourChartRef.value);
  const option = {
    xAxis: {
      type: "category",
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      axisLabel: { color: "#666" }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#666" }
    },
    series: [
      {
        data: hourData,
        type: "bar",
        itemStyle: { color: "#409eff" },
        barWidth: "60%"
      }
    ],
    grid: { left: 40, right: 20, top: 30, bottom: 30 }
  };
  hourChart.setOption(option);
  hourChart.resize();
}

// 渲染雷达图（常见用户名登录尝试分布）
function renderRadarChart(userStats: { username: string; count: number }[]) {
  if (!radarChartRef.value) return;
  if (!radarChart) radarChart = echarts.init(radarChartRef.value);
  const indicators = userStats.map(u => ({
    name: u.username,
    max: Math.max(...userStats.map(x => x.count), 10)
  }));
  const data = userStats.map(u => u.count);
  radarChart.setOption({
    tooltip: {},
    radar: {
      indicator: indicators,
      shape: "circle",
      splitNumber: 4,
      axisName: { color: "#333", fontSize: 14 },
      splitLine: { lineStyle: { color: "#ddd" } },
      splitArea: { areaStyle: { color: ["#f5f7fa", "#fff"] } },
      axisLine: { lineStyle: { color: "#bbb" } }
    },
    series: [
      {
        type: "radar",
        data: [{ value: data, name: "用户名登录尝试" }],
        areaStyle: { color: "rgba(64,158,255,0.2)" },
        lineStyle: { color: "#409eff" },
        symbol: "circle",
        itemStyle: { color: "#409eff" }
      }
    ]
  });
  radarChart.resize();
}

// 渲染散点图（会话持续时间 vs. 源IP）
function renderScatterChart(
  sessionData: { src_ip: string; duration: number }[]
) {
  if (!scatterChartRef.value) return;
  if (!scatterChart) scatterChart = echarts.init(scatterChartRef.value);
  const ipList = Array.from(new Set(sessionData.map(s => s.src_ip)));
  const data = sessionData.map(s => [ipList.indexOf(s.src_ip), s.duration]);
  scatterChart.setOption({
    tooltip: {
      trigger: "item",
      formatter: params =>
        `IP: ${ipList[params.data[0]]}<br>时长: ${params.data[1]}秒`
    },
    xAxis: {
      type: "category",
      data: ipList,
      axisLabel: { rotate: 30, color: "#666", fontSize: 12 },
      name: "源IP",
      nameTextStyle: { fontWeight: "bold" }
    },
    yAxis: {
      type: "value",
      name: "会话时长(秒)",
      nameTextStyle: { fontWeight: "bold" },
      axisLabel: { color: "#666" }
    },
    series: [
      {
        symbolSize: 12,
        data,
        type: "scatter",
        itemStyle: { color: "#e86033ce" }
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 60 }
  });
  scatterChart.resize();
}

// 渲染仪表盘图表
function renderGaugeChart(value: number, max: number, title: string) {
  if (!gaugeChartRef.value) return;
  if (!gaugeChart) gaugeChart = echarts.init(gaugeChartRef.value);
  gaugeChart.setOption({
    tooltip: { formatter: "{a}<br/>{b}: {c}" },
    series: [
      {
        name: title,
        type: "gauge",
        progress: { show: true, width: 18 },
        axisLine: { lineStyle: { width: 18, color: [[1, "#409eff"]] } },
        axisTick: { show: false },
        splitLine: { length: 18, lineStyle: { color: "#eee", width: 2 } },
        axisLabel: { distance: 20, color: "#666", fontSize: 14 },
        pointer: { width: 6, length: "70%" },
        title: { fontSize: 18, color: "#222" },
        detail: {
          valueAnimation: true,
          fontSize: 20, // 原32，改小
          color: "#409eff",
          offsetCenter: [0, "60%"]
        },
        data: [{ value, name: title }],
        min: 0,
        max
      }
    ]
  });
  gaugeChart.resize();
}

onMounted(async () => {
  const res: any = await getAttackLogs();
  const logs = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
  totalAttacks.value = logs.length;
  // 取最近一条攻击的IP
  if (logs.length) {
    const sortedLogs = logs
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp_parsed).getTime() -
          new Date(a.timestamp_parsed).getTime()
      );
    latestAttackerIp.value = sortedLogs[0]?.peer?.ip || "-";
  } else {
    latestAttackerIp.value = "-";
  }
  latestAttack.value = logs.length
    ? dayjs(
        logs
          .map(l => l.timestamp_parsed)
          .sort()
          .reverse()[0]
      ).format("YYYY-MM-DD HH:mm:ss")
    : "-";
  // 攻击类别统计（排除Unknown Attack）
  const map: Record<string, number> = {};
  logs.forEach(l => {
    if (l.attack_category && l.attack_category !== "Unknown Attack") {
      map[l.attack_category] = (map[l.attack_category] || 0) + 1;
    }
  });
  attackCategoryMap.value = map;

  // 解决概率（示例：本周/上周攻击数对比）
  const today = dayjs();
  const thisWeek = logs.filter(l =>
    dayjs(l.timestamp_parsed).isSame(today, "week")
  ).length;
  const lastWeek = logs.filter(l =>
    dayjs(l.timestamp_parsed).isSame(today.subtract(1, "week"), "week")
  ).length;
  progressData.value = [
    {
      week: "本周",
      percentage: thisWeek
        ? Math.round((thisWeek / (thisWeek + lastWeek)) * 100)
        : 0,
      color: "#67c23a",
      duration: 1.2
    },
    {
      week: "上周",
      percentage: lastWeek
        ? Math.round((lastWeek / (thisWeek + lastWeek)) * 100)
        : 0,
      color: "#409eff",
      duration: 1.2
    }
  ];

  // 最新动态（示例：按天分组，统计每日新增攻击数）
  const dayMap: Record<string, number> = {};
  logs.forEach(l => {
    const d = dayjs(l.timestamp_parsed).format("YYYY-MM-DD");
    dayMap[d] = (dayMap[d] || 0) + 1;
  });
  latestNewsData.value = Object.entries(dayMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([date, requiredNumber]) => ({
      date,
      requiredNumber,
      resolveNumber: Math.floor(requiredNumber * 0.7) // 假设70%已解决
    }));

  // 统计每小时攻击数
  const hourData = Array(24).fill(0);
  logs.forEach(l => {
    const hour = dayjs(l.timestamp_parsed).hour();
    hourData[hour]++;
  });
  await nextTick();
  renderHourChart(hourData);
  window.addEventListener("resize", () => hourChart?.resize());

  // 仪表盘数据（本周攻击增长率）
  const growthRate =
    lastWeek === 0 ? 100 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  renderGaugeChart(growthRate, 100, "%");

  // 获取会话数据（散点图）
  const sessionRes: any = await getSessions({ page: 1, limit: 100 });
  const sessionArr = Array.isArray(sessionRes?.data)
    ? sessionRes.data
    : sessionRes?.data?.data || [];
  const sessionData = sessionArr
    .map((s: any) => ({
      src_ip: s.src_ip,
      duration:
        typeof s.duration === "string"
          ? parseFloat(s.duration)
          : s.duration || 0
    }))
    .filter((s: any) => s.src_ip && s.duration > 0);
  await nextTick();
  renderScatterChart(sessionData);
});
</script>

<template>
  <div>
    <el-row :gutter="24" justify="space-around">
      <!-- 第一行四个模块 -->
      <el-col :span="6">
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">攻击总数</span>
            <div
              class="w-8 h-8 flex justify-center items-center rounded-md"
              style="background-color: #ffe5e0"
            >
              <el-icon color="#e86033ce"><WarningFilled /></el-icon>
            </div>
          </div>
          <div class="flex justify-between items-start mt-3">
            <div class="w-1/2">
              <span class="stat-num">{{ totalAttacks }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">最近攻击者IP</span>
            <div
              class="w-8 h-8 flex justify-center items-center rounded-md"
              style="background-color: #e6f7ff"
            >
              <el-icon color="#41b6ff"><DataLine /></el-icon>
            </div>
          </div>
          <div class="flex justify-between items-start mt-3">
            <div class="w-1/2">
              <span class="stat-num stat-ip">{{ latestAttackerIp }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">最近攻击时间</span>
            <div
              class="w-8 h-8 flex justify-center items-center rounded-md"
              style="background-color: #e6ffe6"
            >
              <el-icon color="#67c23a"><Histogram /></el-icon>
            </div>
          </div>
          <div class="flex justify-between items-start mt-3">
            <div class="w-full">
              <span class="stat-time">{{ latestAttack }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="line-card" shadow="never">
          <div class="flex justify-between">
            <span class="text-md font-medium">攻击类别分布</span>
            <div
              class="w-8 h-8 flex justify-center items-center rounded-md"
              style="background-color: #fffbe6"
            >
              <el-icon color="#f39c12"><PieChart /></el-icon>
            </div>
          </div>
          <div class="category-list mt-3">
            <div v-for="(v, k) in attackCategoryMap" :key="k">
              <span class="cat-key">{{ k }}</span>
              <span class="cat-val">{{ v }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 间隔 -->
    <div class="row-gap" />
    <el-row :gutter="24" justify="space-around">
      <!-- 第二行两个模块 -->
      <el-col :span="12">
        <el-card shadow="never" class="h-[380px]">
          <div class="flex justify-between">
            <span class="text-md font-medium">最新动态</span>
          </div>
          <el-scrollbar max-height="320" class="mt-3">
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in latestNewsData"
                :key="index"
                center
                placement="top"
                :timestamp="item.date"
              >
                <p class="text-text_color_regular text-sm">
                  新增 {{ item.requiredNumber }} 条攻击
                </p>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="h-[380px]">
          <div class="flex justify-between">
            <span class="text-md font-medium">攻击时段分布</span>
          </div>
          <div
            ref="hourChartRef"
            style="width: 100%; height: 320px; margin-top: 20px"
          />
        </el-card>
      </el-col>
    </el-row>
    <div class="row-gap" />
    <!-- 第三行两个模块 -->
    <el-row :gutter="24" justify="space-around">
      <el-col :span="12">
        <el-card shadow="never" class="h-[380px]">
          <div class="flex justify-between">
            <span class="text-md font-medium">本周攻击增长率</span>
          </div>
          <div
            ref="gaugeChartRef"
            style="width: 100%; height: 320px; margin-top: 20px"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="h-[380px]">
          <div class="flex justify-between">
            <span class="text-md font-medium">最近攻击会话持续时间分布</span>
          </div>
          <div
            ref="scatterChartRef"
            style="width: 100%; height: 320px; margin-top: 20px"
          />
        </el-card>
      </el-col>
    </el-row>
    <div class="welcome-footer">
      <span>基于SM2加密的SDN蜜罐动态防御系统</span>
    </div>
  </div>
</template>

<style scoped>
.line-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
  background: rgb(255 255 255 / 95%);
  border-radius: 18px;
  box-shadow: 0 4px 24px #0002;
}

.stat-num,
.stat-time {
  display: block;
  max-width: 100%;
  font-size: 1.5em;
  font-weight: 600;
  color: #222;
  word-break: break-all;
}

.stat-ip {
  display: block;
  max-width: 100%;
  text-overflow: ellipsis;
  font-size: 1.5em;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
}

.text-md {
  font-size: 1.1em;
}

.category-list {
  margin-top: 10px;
  font-size: 1.1em;
}

.cat-key {
  margin-right: 10px;
  font-weight: bold;
  color: #333;
}

.cat-val {
  font-weight: bold;
  color: #e86033ce;
}

.welcome-footer {
  margin-top: 60px;
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  letter-spacing: 1px;
  opacity: 0.8;
}

.row-gap {
  height: 32px;
}
</style>
