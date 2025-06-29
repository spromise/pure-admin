<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>会话数据展示</span>
      </div>
    </template>
    <div class="filter-container">
      <el-select
        v-model="filterSrcIp"
        placeholder="筛选源IP"
        clearable
        class="filter-select"
        @change="applyFilters"
      >
        <el-option
          v-for="(ip, index) in uniqueSrcIps"
          :key="'src_' + index"
          :label="ip"
          :value="ip"
        />
      </el-select>
      <el-select
        v-model="filterDstIp"
        placeholder="筛选目标IP"
        clearable
        class="filter-select"
        @change="applyFilters"
      >
        <el-option
          v-for="(ip, index) in uniqueDstIps"
          :key="'dst_' + index"
          :label="ip"
          :value="ip"
        />
      </el-select>
      <el-select
        v-model="filterDstPort"
        placeholder="筛选目标端口"
        clearable
        class="filter-select"
        @change="applyFilters"
      >
        <el-option
          v-for="(port, index) in uniqueDstPorts"
          :key="'port_' + index"
          :label="port"
          :value="port"
        />
      </el-select>
      <el-select
        v-model="filterProtocol"
        placeholder="筛选协议"
        clearable
        class="filter-select"
        @change="applyFilters"
      >
        <el-option
          v-for="(protocol, index) in uniqueProtocols"
          :key="'protocol_' + index"
          :label="protocol"
          :value="protocol"
        />
      </el-select>
    </div>
    <el-table
      v-loading="loading"
      :data="filteredData"
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="220" />
      <el-table-column prop="src_ip" label="源IP" width="120" />
      <el-table-column prop="dst_ip" label="目标IP" width="120" />
      <el-table-column prop="dst_port" label="目标端口" width="100" />
      <el-table-column prop="protocol" label="协议" width="100" />
      <el-table-column prop="session" label="会话ID" width="180" />
      <el-table-column label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.starttime) }}
        </template>
      </el-table-column>
      <el-table-column label="结束时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.endtime) }}
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="持续时间" />
    </el-table>
    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        :pager-count="7"
        layout="prev, pager, next, jumper, total"
        @current-change="handlePageChange"
      />
      <div class="page-info">
        第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { getSessions } from "@/api/test";
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import dayjs from "dayjs";

defineOptions({
  name: "DataDisplay3"
});

const router = useRouter();
const sessionData = ref([]);
const currentPage = ref(1);
const loading = ref(false);
const filterSrcIp = ref("");
const filterDstIp = ref("");
const filterDstPort = ref("");
const filterProtocol = ref("");
const pageSize = ref(15);
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value))
);

// 获取唯一源IP列表
const uniqueSrcIps = computed(() => {
  return [...new Set(sessionData.value.map(item => item.src_ip))];
});

// 获取唯一目标IP列表
const uniqueDstIps = computed(() => {
  return [...new Set(sessionData.value.map(item => item.dst_ip))];
});

// 获取唯一目标端口列表
const uniqueDstPorts = computed(() => {
  return [...new Set(sessionData.value.map(item => item.dst_port))];
});

// 获取唯一协议列表
const uniqueProtocols = computed(() => {
  return [...new Set(sessionData.value.map(item => item.protocol))];
});

// 应用筛选条件
const applyFilters = () => {
  currentPage.value = 1; // 重置到第一页
};

// 筛选后的数据（未分页）
const filteredAllData = computed(() => {
  return sessionData.value.filter(item => {
    const matchesSrcIp = filterSrcIp.value
      ? item.src_ip === filterSrcIp.value
      : true;
    const matchesDstIp = filterDstIp.value
      ? item.dst_ip === filterDstIp.value
      : true;
    const matchesDstPort = filterDstPort.value
      ? item.dst_port === filterDstPort.value
      : true;
    const matchesProtocol = filterProtocol.value
      ? item.protocol === filterProtocol.value
      : true;
    return matchesSrcIp && matchesDstIp && matchesDstPort && matchesProtocol;
  });
});

// 新增：监听filteredAllData变化，自动更新totalCount
watch(filteredAllData, val => {
  totalCount.value = val.length;
});

// 当前页数据
const filteredData = computed(() => {
  const data = filteredAllData.value;
  const start = (currentPage.value - 1) * pageSize.value;
  return data.slice(start, start + pageSize.value);
});

const handlePageChange = page => {
  currentPage.value = page;
};

const fetchSessionData = async () => {
  try {
    loading.value = true;
    // 一次性获取所有数据
    const response = await getSessions({ page: 1, limit: 10000 });
    if (response?.data) {
      sessionData.value = response.data;
      totalCount.value = sessionData.value.length;
    }
  } catch (error) {
    console.error("获取会话数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const formatTime = timestamp => {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
};

// 定时器ID
const refreshTimer = ref<NodeJS.Timeout>();
// 自动刷新间隔（毫秒）
const refreshInterval = 30000;

onMounted(async () => {
  await fetchSessionData();
  // 启动定时刷新
  refreshTimer.value = setInterval(fetchSessionData, refreshInterval);
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  width: 150px;
}

.pagination-container {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.page-info {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}
</style>
