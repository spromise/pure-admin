<template>
  <el-card>
    <div>攻击日志页面</div>
    <el-table :data="pagedLogs" border style="width: 100%; margin-top: 20px">
      <!-- 展开行 -->
      <el-table-column type="expand">
        <template #default="{ row }">
          <div style="padding: 10px">
            <div v-if="row.headers">
              <b>数据包头：</b>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item
                  v-for="(v, k) in row.headers"
                  :key="k"
                  :label="k"
                >
                  {{ v }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
            <div v-if="row.peer" style="margin-top: 10px">
              <b>请求端信息：</b>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="ip">{{
                  row.peer.ip
                }}</el-descriptions-item>
                <el-descriptions-item label="port">{{
                  row.peer.port
                }}</el-descriptions-item>
                <el-descriptions-item v-if="row.peer.ip_info" label="ip_info">
                  <div v-for="(v, k) in row.peer.ip_info" :key="k">
                    {{ k }}: {{ v }}
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </div>
            <div v-if="row.response_msg" style="margin-top: 10px">
              <b>响应消息：</b>
              <el-descriptions :column="1" size="small" border>
                <el-descriptions-item
                  v-for="(v, k) in row.response_msg"
                  :key="k"
                  :label="k"
                >
                  <div v-if="typeof v === 'object' && v !== null">
                    <div v-for="(vv, kk) in v" :key="kk">
                      {{ kk }}: {{ vv }}
                    </div>
                  </div>
                  <div v-else>
                    {{ v }}
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </template>
      </el-table-column>
      <!-- 普通字段 -->
      <el-table-column prop="timestamp_parsed" label="到达时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp_parsed) }}
        </template>
      </el-table-column>
      <el-table-column prop="processed_at" label="开始处理时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.processed_at) }}
        </template>
      </el-table-column>
      <el-table-column prop="attack_category" label="攻击类别" width="120" />
      <el-table-column prop="cookies" label="Cookies">
        <template #default="{ row }">
          <div v-if="row.cookies">
            <div v-for="(v, k) in row.cookies" :key="k">{{ k }}: {{ v }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="method" label="请求方法" width="80" />
      <el-table-column prop="path" label="请求路径" width="200" />
      <el-table-column prop="post_data" label="Post数据">
        <template #default="{ row }">
          <div v-if="row.post_data">
            <div v-for="(v, k) in row.post_data" :key="k">{{ k }}: {{ v }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="响应状态码" width="100" />
      <el-table-column prop="uuid" label="数据包ID" width="220" />
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
import { ref, onMounted, computed } from "vue";
import { getAttackLogs } from "@/api/test";
import dayjs from "dayjs";

const attackLogs = ref([]);
const currentPage = ref(1);
const pageSize = ref(15);
const totalCount = ref(0);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / pageSize.value))
);

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return attackLogs.value.slice(start, start + pageSize.value);
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

function formatTime(val: string | Date) {
  return val ? dayjs(val).format("YYYY-MM-DD HH:mm:ss") : "";
}

onMounted(async () => {
  try {
    const res = await getAttackLogs();
    attackLogs.value = res.data || [];
    totalCount.value = attackLogs.value.length;
    console.log("攻击日志数据：", res.data);
  } catch (error) {
    console.error("获取攻击日志失败：", error);
  }
});
</script>

<style scoped>
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
