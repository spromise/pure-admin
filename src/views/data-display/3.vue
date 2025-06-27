<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>会话数据展示</span>
      </div>
    </template>
    <el-table :data="sessionData" border style="width: 100%">
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
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { getSessions } from "@/api/test";
import { ref, onMounted } from "vue";
import dayjs from "dayjs";

defineOptions({
  name: "DataDisplay3"
});

const router = useRouter();
const sessionData = ref([]);

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

onMounted(async () => {
  try {
    console.log('开始请求会话数据...');
    const response = await getSessions();
    console.group('会话数据响应');
    console.log('完整响应对象:', response);
    console.log('响应数据:', response?.data);
    console.groupEnd();
    
    if (response?.data) {
      sessionData.value = response.data;
    }
  } catch (error) {
    console.error('获取会话数据失败:', error);
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
