<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>认证数据展示</span>
      </div>
    </template>
    <el-table :data="authData" border style="width: 100%">
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
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { getAuth } from "@/api/test";
import { ref, onMounted } from "vue";
import dayjs from "dayjs";

defineOptions({
  name: "DataDisplay2"
});

const router = useRouter();
const authData = ref([]);

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

onMounted(async () => {
  try {
    console.log('开始请求认证数据...');
    const response = await getAuth();
    console.group('认证数据响应');
    console.log('完整响应对象:', response);
    console.log('响应数据:', response?.data);
    console.groupEnd();
    
    if (response?.data) {
      authData.value = response.data;
    }
  } catch (error) {
    console.error('获取认证数据失败:', error);
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
