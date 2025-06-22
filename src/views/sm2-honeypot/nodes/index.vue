<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium">蜜罐节点管理</span>
          <div>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>添加节点
            </el-button>
            <el-button @click="refreshNodes">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="nodes" stripe style="width: 100%">
        <el-table-column prop="name" label="节点名称" width="180" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="type" label="节点类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'honeypot' ? 'danger' : 'info'">
              {{ row.type === "honeypot" ? "蜜罐" : "网络设备" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColor(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastActive" label="最后活跃" width="180">
          <template #default="{ row }">
            {{ formatDate(row.lastActive) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="editNode(row)">编辑</el-button>
            <el-button
              size="small"
              :type="row.active ? 'danger' : 'success'"
              @click="toggleNodeStatus(row)"
            >
              {{ row.active ? "禁用" : "启用" }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteNode(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-between items-center">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
        />
        <el-tag type="info">
          共 {{ nodes.length }} 个节点，其中 {{ activeNodesCount }} 个活跃
        </el-tag>
      </div>
    </el-card>

    <!-- 添加/编辑节点对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑蜜罐节点' : '添加新节点'"
      width="500px"
    >
      <el-form :model="currentNode" label-width="100px">
        <el-form-item label="节点名称" required>
          <el-input v-model="currentNode.name" placeholder="输入节点名称" />
        </el-form-item>
        <el-form-item label="IP地址" required>
          <el-input v-model="currentNode.ip" placeholder="输入IP地址" />
        </el-form-item>
        <el-form-item label="节点类型">
          <el-select v-model="currentNode.type" placeholder="选择节点类型">
            <el-option label="蜜罐" value="honeypot" />
            <el-option label="防火墙" value="firewall" />
            <el-option label="交换机" value="switch" />
            <el-option label="路由器" value="router" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input
            v-model="currentNode.description"
            type="textarea"
            :rows="3"
            placeholder="输入节点描述"
          />
        </el-form-item>
        <el-form-item label="启用节点">
          <el-switch v-model="currentNode.active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNode">
          {{ isEditing ? "更新" : "添加" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useHoneypotStore } from "@/store/modules/sm2Honeypot";

const honeypotStore = useHoneypotStore();

// 节点数据
const nodes = ref([
  {
    id: 1,
    name: "核心蜜罐节点",
    ip: "192.168.1.100",
    type: "honeypot",
    status: "active",
    lastActive: new Date(),
    description: "主要攻击诱捕节点",
    active: true
  },
  {
    id: 2,
    name: "边缘防火墙",
    ip: "192.168.1.1",
    type: "firewall",
    status: "active",
    lastActive: new Date(Date.now() - 3600000),
    description: "网络边界防火墙",
    active: true
  },
  {
    id: 3,
    name: "数据库蜜罐",
    ip: "192.168.1.150",
    type: "honeypot",
    status: "warning",
    lastActive: new Date(Date.now() - 86400000),
    description: "模拟数据库服务",
    active: true
  },
  {
    id: 4,
    name: "备份节点",
    ip: "192.168.1.200",
    type: "honeypot",
    status: "inactive",
    lastActive: new Date(Date.now() - 172800000),
    description: "备用蜜罐节点",
    active: false
  }
]);

// 分页配置
const pagination = ref({
  current: 1,
  size: 10,
  total: 4
});

// 对话框状态
const dialogVisible = ref(false);
const isEditing = ref(false);
const currentNode = ref({
  id: 0,
  name: "",
  ip: "",
  type: "honeypot",
  status: "inactive",
  lastActive: new Date(),
  description: "",
  active: true
});

// 计算属性
const activeNodesCount = computed(() => {
  return nodes.value.filter(node => node.active).length;
});

// 状态显示
const statusColor = status => {
  switch (status) {
    case "active":
      return "success";
    case "warning":
      return "warning";
    case "inactive":
      return "danger";
    default:
      return "info";
  }
};

const statusText = status => {
  switch (status) {
    case "active":
      return "活跃";
    case "warning":
      return "警告";
    case "inactive":
      return "离线";
    default:
      return "未知";
  }
};

// 日期格式化
const formatDate = date => {
  return new Date(date).toLocaleString();
};

// 打开添加对话框
const openAddDialog = () => {
  currentNode.value = {
    id: 0,
    name: "",
    ip: "",
    type: "honeypot",
    status: "inactive",
    lastActive: new Date(),
    description: "",
    active: true
  };
  isEditing.value = false;
  dialogVisible.value = true;
};

// 编辑节点
const editNode = node => {
  currentNode.value = { ...node };
  isEditing.value = true;
  dialogVisible.value = true;
};

// 保存节点
const saveNode = () => {
  if (!currentNode.value.name || !currentNode.value.ip) {
    ElMessage.warning("请填写节点名称和IP地址");
    return;
  }

  if (isEditing.value) {
    // 更新现有节点
    const index = nodes.value.findIndex(n => n.id === currentNode.value.id);
    if (index !== -1) {
      nodes.value[index] = { ...currentNode.value };
      ElMessage.success("节点更新成功");
    }
  } else {
    // 添加新节点
    const newId = Math.max(...nodes.value.map(n => n.id)) + 1;
    nodes.value.push({
      ...currentNode.value,
      id: newId,
      status: currentNode.value.active ? "active" : "inactive"
    });
    pagination.value.total = nodes.value.length;
    ElMessage.success("节点添加成功");
  }

  dialogVisible.value = false;
};

// 切换节点状态
const toggleNodeStatus = node => {
  node.active = !node.active;
  node.status = node.active ? "active" : "inactive";
  ElMessage.success(`节点已${node.active ? "启用" : "禁用"}`);
};

// 删除节点
const deleteNode = node => {
  ElMessageBox.confirm(`确定要删除节点 "${node.name}" 吗?`, "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    const index = nodes.value.findIndex(n => n.id === node.id);
    if (index !== -1) {
      nodes.value.splice(index, 1);
      pagination.value.total = nodes.value.length;
      ElMessage.success("节点已删除");
    }
  });
};

// 刷新节点
const refreshNodes = () => {
  ElMessage.info("节点列表已刷新");
};

onMounted(() => {
  // 这里实际应调用API获取节点数据
  // honeypotStore.fetchNodes();
});
</script>

<style scoped>
.node-status-tag {
  margin-left: 10px;
}
</style>
