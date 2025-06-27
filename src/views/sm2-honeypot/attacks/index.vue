<script setup lang="ts">
import { useRouter } from "vue-router";
import { getAuth } from "@/api/test";
import { ref, onMounted } from "vue";
import { ElTable, ElTableColumn } from "element-plus";

defineOptions({
  name: "Attacks"
});

const router = useRouter();
interface AuthRecord {
  id: number;
  src_ip: string;
  system: string;
  time: string;
  username: string;
  session?: string;
}

const authData = ref<AuthRecord[]>([]); // 改为数组类型存储多条数据
const loading = ref(true);
const error = ref(null);

const fetchAuthData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await getAuth();
    console.groupCollapsed("[DEBUG] API响应数据");
    console.log("完整响应对象:", response);
    console.log("响应数据:", response?.data);
    console.log("数据类型:", typeof response?.data);
    console.log("数据长度:", response?.data?.length);
    console.groupEnd();

    if (!response?.data) {
      error.value = "未获取到有效数据";
      authData.value = [];
      return;
    }

    // 转换数据结构以匹配表格
    authData.value = response.data.map(item => ({
      id: item.id,
      src_ip: item.src_ip,
      dst_ip: item.system,
      protocol: "SM2",
      timestamp: new Date(item.time).toLocaleString(),
      status: item.session ? "success" : "danger",
      details: `用户: ${item.username} 尝试认证`
    }));
  } catch (err) {
    console.error('[DEBUG] 请求错误:', err);
    error.value = err instanceof Error ? err.message : '请求数据时发生未知错误';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="app-container">
    <h1 class="mb-4">认证攻击数据</h1>

    <el-card v-loading="loading">
      <template v-if="error">
        <el-alert :title="error" type="error" show-icon />
      </template>
      <template v-else>
        <!-- 修改表格列定义 -->
        <el-table :data="authData" border stripe style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="src_ip" label="源IP" width="150" />
          <el-table-column prop="dst_ip" label="目标系统" width="150" />
          <el-table-column prop="protocol" label="协议" width="100" />
          <el-table-column prop="timestamp" label="时间" width="180" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === "success" ? "成功" : "失败" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="details" label="认证详情" />
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}
</style>