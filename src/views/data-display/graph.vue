<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>认证关系网络图</span>
        <div>
          <el-tag type="success">点击用户名查看密码</el-tag>
          <el-tag type="info">双击空白处重置视图</el-tag>
        </div>
      </div>
    </template>

    <div class="controls">
      <el-button type="primary" @click="resetLayout">重置布局</el-button>
      <el-button @click="toggleAnimation">{{
        animationEnabled ? "禁用动画" : "启用动画"
      }}</el-button>

      <div class="password-control">
        <span>每个用户显示密码数量:</span>
        <el-input-number
          v-model="passwordsPerUser"
          :min="10"
          :max="50"
          :step="1"
          controls-position="right"
          @change="handlePasswordCountChange"
        />
      </div>

      <el-slider
        v-model="repulsion"
        :min="50"
        :max="500"
        :step="10"
        show-input
        style="width: 300px"
      >
        <template #prepend>斥力强度</template>
      </el-slider>
    </div>

    <div class="chart-container">
      <div ref="chartRef" class="chart" />
      <div class="legend-box">
        <div class="legend-item">
          <div class="legend-color" style="background-color: #4575b4" />
          <span class="legend-label">源IP节点</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #1a9850" />
          <span class="legend-label">用户名节点</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #ff5722" />
          <span class="legend-label">激活的用户名</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #ffeb3b" />
          <span class="legend-label">密码节点</span>
        </div>
      </div>
    </div>

    <div class="tips">
      <el-icon><info-filled /></el-icon>
      <span
        >提示: 每个用户名至少显示10个，最多显示50个最高频密码。当前显示
        {{ passwordsPerUser }} 个。</span
      >
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { getAuth } from "@/api/test";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";

// 定义组件名称
defineOptions({
  name: "AuthNetworkGraph"
});

// 获取图表DOM引用
const chartRef = ref<HTMLElement>();

// 存储原始数据用于动态显示
const allNodes = ref<any[]>([]);
const allLinks = ref<any[]>([]);

// 当前激活的用户名
const activeUsername = ref<string | null>(null);

// 布局控制参数
const repulsion = ref(50);
const animationEnabled = ref(true);
const passwordsPerUser = ref(10); // 每个用户显示的密码数量
const rawApiData = ref<any[]>([]); // 存储原始API数据

// 从API获取数据并处理
const getRealData = async () => {
  // 存储节点和关系的计数器
  const nodes = [];
  const links = [];
  const ipCounter = new Map(); // IP使用频次
  const userCounter = new Map(); // 用户名使用频次
  const ipUserCounter = new Map(); // IP-用户名组合使用次数
  const userPasswordMap = new Map<string, Map<string, number>>(); // 用户名-密码映射

  try {
    // 获取认证数据，设置limit为1000以获取足够多的数据
    const response = await getAuth({ page: 1, limit: 5000 });
    rawApiData.value = response.data; // 存储原始数据

    // 处理数据：统计各类节点和关系
    response.data.forEach(item => {
      // 统计IP节点
      const ipCount = ipCounter.get(item.src_ip) || 0;
      ipCounter.set(item.src_ip, ipCount + 1);

      // 统计用户名节点
      const userCount = userCounter.get(item.username) || 0;
      userCounter.set(item.username, userCount + 1);

      // 统计IP-用户名关系
      const ipUserKey = `${item.src_ip}::${item.username}`;
      const ipUserCount = ipUserCounter.get(ipUserKey) || 0;
      ipUserCounter.set(ipUserKey, ipUserCount + 1);

      // 统计用户名-密码关系 (使用嵌套Map)
      if (!userPasswordMap.has(item.username)) {
        userPasswordMap.set(item.username, new Map<string, number>());
      }
      const passwordMap = userPasswordMap.get(item.username)!;
      const passCount = passwordMap.get(item.password) || 0;
      passwordMap.set(item.password, passCount + 1);
    });

    // 生成IP节点 - 初始位置在左侧
    ipCounter.forEach((value, key) => {
      nodes.push({
        id: `ip-${key}`,
        name: key,
        symbolSize: Math.min(10 + value * 2, 50),
        category: 0, // IP节点
        itemStyle: {
          color: "#4575b4" // 蓝色
        },
        // 初始位置（左侧区域）
        x: -300 + Math.random() * 200,
        y: -200 + Math.random() * 400
      });
    });

    // 生成用户名节点 - 初始位置在中间
    userCounter.forEach((value, key) => {
      nodes.push({
        id: `user-${key}`,
        name: key,
        symbolSize: Math.min(10 + value * 2, 40),
        category: 1, // 用户名节点
        itemStyle: {
          color: "#1a9850" // 绿色
        },
        // 初始位置（中间区域）
        x: -100 + Math.random() * 200,
        y: -200 + Math.random() * 400
      });
    });

    // 生成密码节点 - 每个用户名下的密码都是独立的节点
    userPasswordMap.forEach((passwordMap, username) => {
      // 对当前用户名的密码按使用频率排序，取前N个
      const sortedPasswords = Array.from(passwordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, passwordsPerUser.value);

      sortedPasswords.forEach(([password, count]) => {
        // 为每个用户名-密码对创建独立节点
        const nodeId = `pass-${username}::${password}`;
        nodes.push({
          id: nodeId,
          name: password,
          symbolSize: Math.min(10 + count * 2, 30),
          category: 2, // 密码节点
          // 初始状态隐藏密码节点
          itemStyle: {
            color: "#FFEB3B", // 黄色
            opacity: 0 // 完全透明
          },
          // 设置忽略状态，使其不参与布局
          ignore: true
        });
      });
    });

    // 生成IP-用户名关系
    ipUserCounter.forEach((value, key) => {
      const [ip, user] = key.split("::");
      links.push({
        source: `ip-${ip}`,
        target: `user-${user}`,
        value: Math.min(1 + value * 0.5, 5), // 根据组合使用次数调整粗细
        lineStyle: {
          width: Math.min(1 + value * 0.5, 5),
          color: "#4575b4" // 蓝色线条连接IP和用户名
        }
      });
    });

    // 用户名和密码的连接关系（初始隐藏）
    userPasswordMap.forEach((passwordMap, username) => {
      // 对当前用户名的密码按使用频率排序，取前N个
      const sortedPasswords = Array.from(passwordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, passwordsPerUser.value);

      sortedPasswords.forEach(([password, count]) => {
        const nodeId = `pass-${username}::${password}`;
        links.push({
          source: `user-${username}`,
          target: nodeId,
          value: 3, // 固定粗细
          lineStyle: {
            width: 3,
            color: "#CCCCCC", // 浅灰色线条连接用户名和密码
            opacity: 0, // 完全透明
            type: "dashed" // 使用虚线
          },
          // 设置忽略状态，使其不参与布局
          ignore: true
        });
      });
    });

    // 保存原始数据用于动态显示
    allNodes.value = nodes;
    allLinks.value = links;

    // 初始返回的节点和连接线（不包含密码节点和密码连接线）
    const initialNodes = nodes.filter(node => node.category !== 2);
    const initialLinks = links.filter(link => !link.target?.includes("pass-"));

    return { nodes: initialNodes, links: initialLinks };
  } catch (error) {
    console.error("获取数据失败:", error);
    return { nodes: [], links: [] };
  }
};

// 图表实例
const myChart = ref<echarts.ECharts>();

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return;

  try {
    // 销毁旧图表实例
    if (myChart.value) {
      myChart.value.dispose();
    }

    // 重新创建图表实例
    myChart.value = echarts.init(chartRef.value);
    const { nodes, links } = await getRealData();

    // 图表配置
    const option = {
      title: {
        text: "认证关系网络图",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold"
        }
      },
      tooltip: {
        formatter: function (params: any) {
          if (params.dataType === "node") {
            return `${params.name}<br/>类型: ${["源IP", "用户名", "密码"][params.data.category]}`;
          } else if (params.dataType === "edge") {
            return `连接关系: ${params.data.source.split("-")[1]} - ${params.data.target.split("-")[1]}`;
          }
          return "";
        }
      },
      animation: animationEnabled.value,
      animationDuration: 800,
      animationEasing: "cubicOut",
      series: [
        {
          name: "认证关系",
          type: "graph",
          layout: "force",
          draggable: true,
          data: nodes,
          links: links,
          categories: [{ name: "源IP" }, { name: "用户名" }, { name: "密码" }],
          roam: true,
          zoom: 1.2,
          label: {
            show: true,
            position: "right",
            fontSize: 12,
            formatter: function (params: any) {
              // 简化显示，避免长文本
              const text = params.data.name;
              return text.length > 15 ? text.substring(0, 12) + "..." : text;
            }
          },
          force: {
            repulsion: repulsion.value,
            edgeLength: 80,
            layoutAnimation: true,
            friction: 0.6,
            gravity: 0.05
          },
          emphasis: {
            focus: "adjacency",
            label: {
              show: true,
              fontWeight: "bold"
            }
          },
          lineStyle: {
            opacity: 0.9,
            width: 1,
            curveness: 0
          }
        }
      ]
    };

    // 应用配置
    myChart.value.setOption(option);

    // 添加点击事件处理
    myChart.value.on("click", params => {
      if (params.dataType === "node" && params.data.category === 1) {
        // 点击用户名节点，显示关联的密码
        toggleUsernameActivation(params.data.name);
      }
    });

    // 双击空白处重置视图
    myChart.value.on("dblclick", () => {
      resetView();
    });
  } catch (error) {
    ElMessage.error("图表初始化失败: " + (error as Error).message);
  }
};

// 切换用户名激活状态
const toggleUsernameActivation = (username: string) => {
  if (!myChart.value) return;

  const option = myChart.value.getOption() as any;
  const currentNodes = option.series[0].data;
  const currentLinks = option.series[0].links;

  // 1. 如果之前有激活的用户名，先隐藏其密码
  if (activeUsername.value) {
    hidePasswords(activeUsername.value, currentNodes, currentLinks);

    // 重置之前激活的用户名节点状态
    const prevUserIndex = currentNodes.findIndex(
      (n: any) => n.id === `user-${activeUsername.value}`
    );
    if (prevUserIndex !== -1) {
      currentNodes[prevUserIndex] = {
        ...currentNodes[prevUserIndex],
        itemStyle: {
          ...currentNodes[prevUserIndex].itemStyle,
          color: "#1a9850" // 恢复为绿色
        }
      };
    }
  }

  // 2. 如果点击的是当前激活的用户名，则只取消激活状态
  if (activeUsername.value === username) {
    activeUsername.value = null;
    updateChart(currentNodes, currentLinks);
    return;
  }

  // 3. 激活当前点击的用户名
  activeUsername.value = username;

  // 更新当前用户名节点状态（变为亮色）
  const userIndex = currentNodes.findIndex(
    (n: any) => n.id === `user-${username}`
  );
  if (userIndex !== -1) {
    currentNodes[userIndex] = {
      ...currentNodes[userIndex],
      itemStyle: {
        ...currentNodes[userIndex].itemStyle,
        color: "#ff5722" // 亮橙色表示激活状态
      }
    };
  }

  // 4. 显示与该用户名关联的密码
  showRelatedPasswords(username, currentNodes, currentLinks);
};

// 更新图表
const updateChart = (nodes: any[], links: any[]) => {
  if (!myChart.value) return;

  myChart.value.setOption({
    series: [
      {
        data: nodes,
        links: links,
        force: {
          repulsion: repulsion.value
        }
      }
    ]
  });
};

// 显示与用户名关联的密码
const showRelatedPasswords = (
  username: string,
  currentNodes: any[],
  currentLinks: any[]
) => {
  // 1. 找出所有与该用户名关联的密码节点
  const relatedPasswordNodes = allNodes.value.filter(
    node => node.category === 2 && node.id.startsWith(`pass-${username}::`)
  );

  // 2. 找出所有用户名和密码的连接线
  const relatedPasswordLinks = allLinks.value.filter(
    link =>
      link.source === `user-${username}` &&
      link.target.startsWith(`pass-${username}::`)
  );

  // 获取用户名节点的位置
  const userNode = currentNodes.find((n: any) => n.id === `user-${username}`);
  if (!userNode) return;

  // 3. 添加或更新节点和连接线
  relatedPasswordNodes.forEach((node: any, index: number) => {
    // 计算密码节点的位置（围绕用户名节点）
    const angle = (index * 2 * Math.PI) / relatedPasswordNodes.length;
    const radius = 100;

    // 设置密码节点的初始位置（围绕用户名节点）
    node.x = (userNode.x || 0) + radius * Math.cos(angle);
    node.y = (userNode.y || 0) + radius * Math.sin(angle);

    const existingNodeIndex = currentNodes.findIndex(
      (n: any) => n.id === node.id
    );
    if (existingNodeIndex !== -1) {
      currentNodes[existingNodeIndex] = {
        ...node,
        itemStyle: {
          ...node.itemStyle,
          opacity: 1 // 显示节点
        },
        ignore: false // 参与布局
      };
    } else {
      currentNodes.push({
        ...node,
        itemStyle: {
          ...node.itemStyle,
          opacity: 1
        },
        ignore: false
      });
    }
  });

  relatedPasswordLinks.forEach((link: any) => {
    const existingLinkIndex = currentLinks.findIndex(
      (l: any) => l.source === link.source && l.target === link.target
    );

    if (existingLinkIndex !== -1) {
      currentLinks[existingLinkIndex] = {
        ...link,
        lineStyle: {
          ...link.lineStyle,
          opacity: 0.7 // 显示连接线
        },
        ignore: false // 参与布局
      };
    } else {
      currentLinks.push({
        ...link,
        lineStyle: {
          ...link.lineStyle,
          opacity: 0.7
        },
        ignore: false
      });
    }
  });

  // 5. 更新图表
  updateChart(currentNodes, currentLinks);
};

// 隐藏与用户名关联的密码
const hidePasswords = (
  username: string,
  currentNodes: any[],
  currentLinks: any[]
) => {
  // 1. 找出所有与该用户名关联的密码节点
  const relatedPasswordNodes = allNodes.value.filter(
    node => node.category === 2 && node.id.startsWith(`pass-${username}::`)
  );

  // 2. 找出所有用户名和密码的连接线
  const relatedPasswordLinks = allLinks.value.filter(
    link =>
      link.source === `user-${username}` &&
      link.target.startsWith(`pass-${username}::`)
  );

  // 3. 更新节点：将密码节点隐藏
  relatedPasswordNodes.forEach((node: any) => {
    const index = currentNodes.findIndex((n: any) => n.id === node.id);
    if (index !== -1) {
      currentNodes[index] = {
        ...currentNodes[index],
        itemStyle: {
          ...currentNodes[index].itemStyle,
          opacity: 0
        },
        ignore: true
      };
    }
  });

  // 4. 更新连接线：将密码连接线隐藏
  relatedPasswordLinks.forEach((link: any) => {
    const index = currentLinks.findIndex(
      (l: any) => l.source === link.source && l.target === link.target
    );
    if (index !== -1) {
      currentLinks[index] = {
        ...currentLinks[index],
        lineStyle: {
          ...currentLinks[index].lineStyle,
          opacity: 0
        },
        ignore: true
      };
    }
  });

  // 5. 更新图表
  updateChart(currentNodes, currentLinks);
};

// 重置视图
const resetView = () => {
  if (!myChart.value) return;
  myChart.value.dispatchAction({
    type: "graphRoam",
    zoom: 1.2,
    originX: 0,
    originY: 0
  });
};

// 重置布局
const resetLayout = () => {
  if (!myChart.value) return;
  activeUsername.value = null;
  initChart();
};

// 切换动画
const toggleAnimation = () => {
  animationEnabled.value = !animationEnabled.value;
  if (myChart.value) {
    myChart.value.setOption({
      animation: animationEnabled.value
    });
  }
};

// 处理密码数量变化
const handlePasswordCountChange = () => {
  // 重置激活状态
  activeUsername.value = null;

  // 关键修复：强制重新获取数据
  rawApiData.value = []; // 清空原始数据缓存
  initChart(); // 重新初始化图表
};

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  myChart.value?.resize();
};

// 组件挂载时初始化图表
onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

// 组件卸载时销毁图表
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  myChart.value?.dispose();
});
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

.password-control {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.password-control span {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 650px;
  overflow: hidden;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.chart {
  width: 100%;
  height: 100%;
}

.legend-box {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
  padding: 10px 15px;
  background: rgb(255 255 255 / 90%);
  border: 1px solid #ebeef5;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
}

.legend-color {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  border-radius: 50%;
}

.legend-label {
  font-size: 12px;
  color: #606266;
}

.tips {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 15px;
  margin-top: 15px;
  font-size: 13px;
  color: #67c23a;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
}

.tips .el-icon {
  font-size: 16px;
}
</style>
