# 项目变更信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**1**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `projectChange`，按**小企业（`prjc-slb`）**页面「项目变更信息」字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析或 HTML 渲染。

页面为「审批变更原因 + 审批变更类型」上下排列的键值对；PDF 按同一顺序输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `1` |
| `moduleKey` | `project_change` |
| `moduleName` | `项目变更信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectChange` | 模块主数据对象 |
| `projectChange.changeReason` | 审批变更原因 |
| `projectChange.changeType` | 审批变更类型 |

---

## 四、整合流程

```text
1. 若 projectChange 为 null / 缺失：整模块不输出
2. 按固定 blocks 顺序组装（见第六节）
3. 为每个字段标注 displayType 并格式化展示值
4. 输出 moduleIndex=1 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

对齐页面截图展示逻辑：

| 场景 | 处理方式 |
| ---- | -------- |
| `projectChange` 缺失 / `null` | 整模块不输出 |
| `changeReason` / `changeType` 为空 | 对应字段展示「—」，模块仍输出 |
| 枚举 / 文案 | 直接展示接口返回的中文值，不做码值转换 |

**展示形态：**

- 模块顶栏标题为「项目变更信息」
- 模块体内**不再**套一层分组标题（无蓝色圆点 group）
- 字段为标签在上、内容在下的上下排列（与页面一致）

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType | 接口字段 |
| :--: | -------- | ----- | ----------- | -------- |
| 1 | `changeReason` | `审批变更原因` | `longText` | `projectChange.changeReason` |
| 2 | `changeType` | `审批变更类型` | `direct` | `projectChange.changeType` |

> `changeReason` 使用 `longText`：标签与内容上下排列，长文自动换行不截断。  
> `changeType` 使用 `direct`：短枚举值直接展示。

---

## 七、字段映射与 displayType 规则

### 7.1 审批变更原因（longText）

```json
{
  "blockKey": "changeReason",
  "label": "审批变更原因",
  "displayType": "longText",
  "value": "补充租赁物型号信息。"
}
```

| 字段 | 取值 | 格式化 |
| ---- | ---- | ------ |
| `value` | `projectChange.changeReason` | `trim` 首尾空白后原样展示；空 → `—` |

### 7.2 审批变更类型（direct）

```json
{
  "blockKey": "changeType",
  "label": "审批变更类型",
  "displayType": "direct",
  "value": "审批修改"
}
```

| 字段 | 取值 | 格式化 |
| ---- | ---- | ------ |
| `value` | `projectChange.changeType` | `trim` 首尾空白后原样展示；空 → `—` |

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 枚举 | 直接展示接口返回的中文值，不做码值转换 |
| 文本 | 不截断、不改写，原样透传 |

---

## 九、输出示例

```json
{
  "moduleIndex": 1,
  "moduleName": "项目变更信息",
  "moduleKey": "project_change",
  "blocks": [
    {
      "blockKey": "changeReason",
      "label": "审批变更原因",
      "displayType": "longText",
      "value": "补充租赁物型号信息。"
    },
    {
      "blockKey": "changeType",
      "label": "审批变更类型",
      "displayType": "direct",
      "value": "审批修改"
    }
  ]
}
```

---

## 十、约束

1. 必须携带 `moduleIndex: 1`
2. 仅输出结构化 JSON，**不包含 HTML 标签**
3. 不修改、不计算、不补充业务数据
4. `projectChange` 缺失时整模块不输出，由 L0 跳过拼接
5. 完整报告须经 L0 调度后交 L2 渲染；本 Skill 输出不得作为最终 HTML 交付物
