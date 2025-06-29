<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>认证数据展示</span>
      </div>
    </template>
    <div class="filter-container">
      <el-select
        v-model="filterUsername"
        placeholder="筛选用户名"
        clearable
        class="filter-select"
        @change="handleFilterChange"
      >
        <el-option
          v-for="(username, index) in uniqueUsernames"
          :key="'username_' + index"
          :label="username"
          :value="username"
        />
      </el-select>
      <el-select
        v-model="filterSrcIp"
        placeholder="筛选源IP"
        clearable
        class="filter-select"
        @change="handleFilterChange"
      >
        <el-option
          v-for="(ip, index) in uniqueSrcIps"
          :key="'ip_' + index"
          :label="ip"
          :value="ip"
        />
      </el-select>
    </div>
    <el-table
      v-loading="loading"
      :data="filteredData"
      border
      style="width: 100%"
    >
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="password" label="密码" width="120" />
      <el-table-column prop="src_ip" label="源IP" width="120" />
      <el-table-column prop="system" label="目标系统" />
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="session" label="会话ID" />
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
import { ref, onMounted, computed, watch } from "vue";
import { getAuth } from "@/api/test";
import dayjs from "dayjs";

const authData = ref([]);
const currentPage = ref(1);
const pageSize = ref(15); // 每页15条
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value))
);
const loading = ref(false);
const filterUsername = ref("");
const filterSrcIp = ref("");
const uniqueUsernames = ref([]);
const uniqueSrcIps = ref([]);

// 前端筛选和分页
const filteredData = computed(() => {
  let data = authData.value;
  if (filterUsername.value) {
    data = data.filter(item => item.username === filterUsername.value);
  }
  if (filterSrcIp.value) {
    data = data.filter(item => item.src_ip === filterSrcIp.value);
  }
  // totalCount.value = data.length; // 移除副作用
  const start = (currentPage.value - 1) * pageSize.value;
  return data.slice(start, start + pageSize.value);
});

// 新增：监听filteredData变化，更新totalCount
watch(filteredData, val => {
  totalCount.value =
    filterUsername.value || filterSrcIp.value
      ? authData.value.filter(item => {
          let match = true;
          if (filterUsername.value)
            match = match && item.username === filterUsername.value;
          if (filterSrcIp.value)
            match = match && item.src_ip === filterSrcIp.value;
          return match;
        }).length
      : authData.value.length;
});

const fetchAuthData = async () => {
  try {
    loading.value = true;
    // 一次性获取所有数据
    const response = await getAuth({ page: 1, limit: 10000 });
    if (response?.data) {
      authData.value = response.data.data || response.data;
      totalCount.value = authData.value.length;
      updateUniqueValues();
    }
  } catch (error) {
    console.error("获取认证数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 处理页码变化
const handlePageChange = (newPage: number) => {
  currentPage.value = newPage;
};

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1; // 重置到第一页
  fetchAuthData();
};

// 更新唯一值列表（现在只使用首次加载的数据）
const updateUniqueValues = () => {
  const usernames = new Set();
  const ips = new Set();

  authData.value.forEach(item => {
    if (item.username) usernames.add(item.username);
    if (item.src_ip) ips.add(item.src_ip);
  });

  uniqueUsernames.value = Array.from(usernames);
  uniqueSrcIps.value = Array.from(ips);
};

// 重要新增：初始化时获取所有唯一值
const fetchUniqueValues = async () => {
  try {
    // 获取所有数据用于提取唯一值（不分页，limit设大）
    const response = await getAuth({
      page: 1,
      limit: 10000
    });
    if (response?.data) {
      const allData = response.data.data || response.data;
      const usernames = new Set();
      const ips = new Set();
      allData.forEach(item => {
        if (item.username) usernames.add(item.username);
        if (item.src_ip) ips.add(item.src_ip);
      });
      uniqueUsernames.value = Array.from(usernames);
      uniqueSrcIps.value = Array.from(ips);
    }
  } catch (error) {
    console.error("获取唯一值失败:", error);
  }
};

const formatTime = (timestamp: string | number) => {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
};

onMounted(async () => {
  await fetchUniqueValues(); // 先获取所有唯一用户名和IP
  await fetchAuthData(); // 再加载第一页数据
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
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  width: 200px;
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
