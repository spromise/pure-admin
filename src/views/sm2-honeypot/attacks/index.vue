<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium">攻击日志分析</span>
          <div>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="mr-2"
            />
            <el-button type="primary" @click="fetchLogs">
              <el-icon><Search /></el-icon>查询
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="honeypotStore.recentAttacks" stripe height="70vh">
        <el-table-column prop="time" label="时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.time).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="srcIp" label="源IP" width="150" />
        <el-table-column prop="type" label="攻击类型" width="120" />
        <el-table-column prop="target" label="目标节点" width="150" />
        <el-table-column label="威胁等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getThreatLevel(row.type)">
              {{ getThreatLevel(row.type) === 'danger' ? '高危' : '中危' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showDetails(row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="blockIp(row.srcIp)">
              封禁IP
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="mt-4 justify-center"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Search } from "@element-plus/icons-vue";
import { useHoneypotStore } from "@/store/modules/sm2Honeypot";

const honeypotStore = useHoneypotStore();
const dateRange = ref<[Date, Date]>([new Date(Date.now() - 7 * 86400000), new Date()]);

const pagination = ref({
  current: 1,
  size: 10,
  total: 0
});

const getThreatLevel = (type: string) => {
  return type === "SQL注入" ? "danger" : "warning";
};

const fetchLogs = () => {
  honeypotStore.fetchAttackLogs();
  // 实际项目中这里应调用API
  pagination.value.total = honeypotStore.recentAttacks.length;
};

const showDetails = (row: any) => {
  console.log("显示详情:", row);
  // 这里可以显示攻击详情弹窗
};

const blockIp = (ip: string) => {
  ElMessageBox.confirm(`确定要封禁IP: ${ip} 吗?`, "警告", {
    confirmButtonText: "确认封禁",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    ElMessage.success(`IP ${ip} 已加入封禁列表`);
  });
};

const handlePageChange = (page: number) => {
  pagination.value.current = page;
  fetchLogs();
};

onMounted(() => {
  fetchLogs();
});
</script>