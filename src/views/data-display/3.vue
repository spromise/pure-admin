<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>数据展示3</span>
      </div>
    </template>
    <div>这里是数据展示3的内容</div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({
  name: "DataDisplay3"
});

const router = useRouter();
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
