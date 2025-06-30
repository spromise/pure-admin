<template>
  <el-card>
    <div>攻击日志页面</div>
    <el-table :data="attackLogs" border style="width: 100%; margin-top: 20px">
      <el-table-column prop="processed_at" label="开始处理时间" width="180" />
      <el-table-column prop="attack_category" label="攻击类别" width="120" />
      <el-table-column prop="cookies" label="Cookies">
        <template #default="{ row }">
          {{ row.cookies ? JSON.stringify(row.cookies) : "" }}
        </template>
      </el-table-column>
      <el-table-column prop="headers" label="数据包头">
        <template #default="{ row }">
          {{ row.headers ? JSON.stringify(row.headers) : "" }}
        </template>
      </el-table-column>
      <el-table-column prop="method" label="请求方法" width="80" />
      <el-table-column prop="path" label="请求路径" width="200" />
      <el-table-column prop="peer" label="请求端信息">
        <template #default="{ row }">
          {{ row.peer ? JSON.stringify(row.peer) : "" }}
        </template>
      </el-table-column>
      <el-table-column prop="post_data" label="Post数据">
        <template #default="{ row }">
          {{ row.post_data ? JSON.stringify(row.post_data) : "" }}
        </template>
      </el-table-column>
      <el-table-column prop="response_msg" label="响应消息">
        <template #default="{ row }">
          {{ row.response_msg ? JSON.stringify(row.response_msg) : "" }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="响应状态码" width="100" />
      <el-table-column prop="timestamp_parsed" label="结束时间" width="180" />
      <el-table-column prop="uuid" label="数据包ID" width="220" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAttackLogs } from "@/api/test";

const attackLogs = ref([]);

onMounted(async () => {
  try {
    const res = await getAttackLogs();
    attackLogs.value = res.data || [];
  } catch (error) {
    console.error("获取攻击日志失败：", error);
  }
});
</script>
