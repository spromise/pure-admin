<template>
  <div class="app-container">
    <el-card shadow="never" class="config-card">
      <template #header>
        <div class="card-header">
          <span class="text-lg font-medium">SM2加密配置</span>
          <el-tag v-if="sm2Config.encryptionEnabled" type="success"
            >已启用</el-tag
          >
          <el-tag v-else type="danger">未启用</el-tag>
        </div>
      </template>

      <el-form label-width="150px">
        <!-- 密钥对生成 -->
        <el-form-item label="密钥对生成">
          <el-button type="primary" @click="generateKeys">
            <el-icon><Key /></el-icon>生成新密钥对
          </el-button>
          <el-alert title="每次生成会覆盖旧密钥" type="warning" class="mt-2" />
        </el-form-item>

        <!-- 公钥区域 -->
        <el-form-item label="公钥">
          <el-input
            v-model="sm2Config.publicKey"
            type="textarea"
            :rows="4"
            placeholder="点击上方按钮生成公钥"
            readonly
            class="key-input"
          />
          <div class="key-actions">
            <el-button @click="copyKey(sm2Config.publicKey)">
              <el-icon><DocumentCopy /></el-icon>复制公钥
            </el-button>
            <el-button
              @click="downloadKey(sm2Config.publicKey, 'sm2_public_key.txt')"
            >
              <el-icon><Download /></el-icon>下载公钥
            </el-button>
          </div>
        </el-form-item>

        <!-- 私钥区域 -->
        <el-form-item label="私钥">
          <el-input
            v-model="sm2Config.privateKey"
            type="textarea"
            :rows="4"
            placeholder="点击上方按钮生成私钥"
            show-password
            class="key-input"
          />
          <div class="key-actions">
            <el-button @click="copyKey(sm2Config.privateKey)">
              <el-icon><DocumentCopy /></el-icon>复制私钥
            </el-button>
            <el-button
              type="danger"
              @click="downloadKey(sm2Config.privateKey, 'sm2_private_key.txt')"
            >
              <el-icon><Download /></el-icon>下载私钥
            </el-button>
          </div>
          <el-alert
            title="私钥是敏感信息，请妥善保管并不要泄露"
            type="error"
            class="mt-2"
            show-icon
          />
        </el-form-item>

        <!-- 加密测试 -->
        <el-form-item label="加密测试">
          <el-input
            v-model="testData"
            placeholder="输入要加密的测试数据"
            class="test-input"
          />
          <div class="test-actions">
            <el-button
              type="primary"
              :disabled="!sm2Config.publicKey"
              @click="encryptTest"
            >
              <el-icon><Lock /></el-icon>执行加密
            </el-button>
            <el-button
              :disabled="!cipherText || !sm2Config.privateKey"
              @click="decryptTest"
            >
              <el-icon><Unlock /></el-icon>执行解密
            </el-button>
            <el-button @click="clearTest">
              <el-icon><Delete /></el-icon>清除
            </el-button>
          </div>
        </el-form-item>

        <!-- 测试结果 -->
        <el-form-item v-if="cipherText || decryptedText" label="测试结果">
          <el-input
            v-if="cipherText"
            v-model="cipherText"
            type="textarea"
            :rows="3"
            placeholder="加密结果将显示在这里"
            readonly
            class="result-input"
          />
          <el-input
            v-if="decryptedText"
            v-model="decryptedText"
            type="textarea"
            :rows="3"
            placeholder="解密结果将显示在这里"
            readonly
            class="result-input mt-2"
          />
          <div class="result-info mt-2">
            <el-tag v-if="cipherText">加密成功</el-tag>
            <el-tag v-if="decryptedText" type="success">解密成功</el-tag>
            <span v-if="testResultMatch" class="text-green-500 ml-2">
              <el-icon><CircleCheck /></el-icon> 加解密结果匹配
            </span>
          </div>
        </el-form-item>

        <!-- 配置选项 -->
        <el-form-item label="加密选项">
          <el-switch
            v-model="sm2Config.encryptionEnabled"
            active-text="启用SM2加密"
            inactive-text="关闭加密"
          />
          <el-checkbox v-model="autoRefreshKeys" class="ml-4">
            每小时自动刷新密钥
          </el-checkbox>
        </el-form-item>

        <!-- 保存配置 -->
        <el-form-item>
          <el-button type="success" @click="saveConfig">
            <el-icon><Check /></el-icon>保存配置
          </el-button>
          <el-button @click="resetConfig">
            <el-icon><Refresh /></el-icon>恢复默认
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Key,
  DocumentCopy,
  Download,
  Lock,
  Unlock,
  Delete,
  Check,
  Refresh,
  CircleCheck
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useHoneypotStore } from "@/store/modules/sm2Honeypot";

const honeypotStore = useHoneypotStore();
const sm2Config = ref({ ...honeypotStore.sm2Config });
const testData = ref("");
const cipherText = ref("");
const decryptedText = ref("");
const autoRefreshKeys = ref(false);

// 计算属性
const testResultMatch = computed(() => {
  return decryptedText.value === testData.value;
});

// 生成密钥
const generateKeys = async () => {
  try {
    await honeypotStore.generateSM2Keys();
    sm2Config.value = { ...honeypotStore.sm2Config };
    ElMessage.success("密钥对生成成功");

    // 清除测试数据
    testData.value = "";
    cipherText.value = "";
    decryptedText.value = "";
  } catch (error) {
    ElMessage.error("密钥生成失败: " + error.message);
  }
};

// 复制密钥
const copyKey = (key: string) => {
  if (!key) {
    ElMessage.warning("没有可复制的密钥内容");
    return;
  }

  navigator.clipboard
    .writeText(key)
    .then(() => ElMessage.success("密钥已复制到剪贴板"))
    .catch(err => ElMessage.error("复制失败: " + err));
};

// 下载密钥
const downloadKey = (content: string, filename: string) => {
  if (!content) {
    ElMessage.warning("没有可下载的密钥内容");
    return;
  }

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 加密测试
const encryptTest = () => {
  if (!testData.value) {
    ElMessage.warning("请输入要加密的测试数据");
    return;
  }

  if (!sm2Config.value.publicKey) {
    ElMessage.error("请先生成公钥");
    return;
  }

  // 实际项目中这里应调用加密接口
  // const result = await SM2Service.encryptData(sm2Config.value.publicKey, testData.value);

  // 模拟加密结果
  cipherText.value = `SM2_ENCRYPTED::${btoa(testData.value)}::${Date.now()}`;
  decryptedText.value = "";
  ElMessage.success("数据加密成功");
};

// 解密测试
const decryptTest = () => {
  if (!cipherText.value) {
    ElMessage.warning("请先执行加密操作");
    return;
  }

  if (!sm2Config.value.privateKey) {
    ElMessage.error("请提供私钥进行解密");
    return;
  }

  // 实际项目中这里应调用解密接口
  // const result = await SM2Service.decryptData(sm2Config.value.privateKey, cipherText.value);

  // 模拟解密结果
  try {
    const parts = cipherText.value.split("::");
    if (parts.length === 3 && parts[0] === "SM2_ENCRYPTED") {
      decryptedText.value = atob(parts[1]);
      ElMessage.success("数据解密成功");
    } else {
      throw new Error("无效的加密格式");
    }
  } catch (error) {
    ElMessage.error("解密失败: " + error.message);
  }
};

// 清除测试
const clearTest = () => {
  testData.value = "";
  cipherText.value = "";
  decryptedText.value = "";
};

// 保存配置
const saveConfig = () => {
  honeypotStore.sm2Config = { ...sm2Config.value };
  ElMessage.success("配置已保存");
};

// 重置配置
const resetConfig = () => {
  ElMessageBox.confirm("确定要恢复默认配置吗？此操作将清除当前密钥", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    sm2Config.value = {
      publicKey: "",
      privateKey: "",
      encryptionEnabled: false
    };
    honeypotStore.sm2Config = { ...sm2Config.value };
    clearTest();
    ElMessage.success("已恢复默认配置");
  });
};

// 初始化
onMounted(() => {
  if (!sm2Config.value.publicKey) {
    ElMessage.info("请先生成SM2密钥对");
  }
});
</script>

<style scoped>
.config-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.key-input {
  font-family: monospace;
  font-size: 0.9rem;
}

.key-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.test-input {
  width: 100%;
  margin-bottom: 10px;
}

.test-actions {
  display: flex;
  gap: 10px;
}

.result-input {
  font-family: monospace;
}

.result-info {
  display: flex;
  align-items: center;
}
</style>
