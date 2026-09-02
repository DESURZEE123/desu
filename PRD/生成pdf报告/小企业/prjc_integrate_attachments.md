# 附件信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**14**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/附件信息.md`  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `attachmentList`，按**小企业（`prjc-slb`）**固定模块分类（L1 写死）归组，映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、分类归组与 displayType 标注**，不调用上传 / 下载 / 同步接口、不做 HTML 渲染。

页面为「按模块 Card 分区 + 分区内文件网格」；PDF **只做附件展示**（无下载图标、无上传 / 删除 / 同步按钮）。

> 若 `attachmentList` 为 null / 缺失：仍输出全部固定分区（文件列表为空）。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `14` |
| `moduleKey` | `attachments` |
| `moduleName` | `附件信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `attachmentList[]` | 附件明细列表 |
| `attachmentList[].fileName` | 附件名称 |
| `attachmentList[].documentDir.name` | 文档类型中文名（用于归组） |
| `attachmentList[].documentDir.code` | 文档类型码值（仅匹配，不输出） |
| `attachmentList[].uploadTime` | 上传时间 |

**L1 写死的分区结构（小企业）：**

| modelName | documentDir（副标题拼接顺序） |
| --------- | ----------------------------- |
| 基础材料 | 营业执照、自然人身份证明、公司章程、开户许可证、开票资料 |
| 征信材料 | 征信附件、征信授权文件 |
| 资质材料 | 厂房租赁合同、不动产权证书、水电费缴纳凭证、特殊行业资质证明、环评批复、房产证 |
| 租赁物材料 | 设备销售合同、代理进口合同、租赁物发票、营业执照（供应商）、身份证明（供应商法人代表）、开户许可证（供应商）、开票资料（供应商） |
| 财税报表 | 财务报表、纳税申报表 |
| 银行流水 | 银行流水、银行流水分析报告 |
| 补充材料 | 政策文件、突破定价申请材料、访厂照片、订单信息、补充材料、其它、客户风险评估报告 |
| 中登报送 | 报送中登 |
| 尽调报告 | 尽职调查报告 |

**PDF 不提取 / 不输出：**

| 字段 / 能力 | 原因 |
| ----------- | ---- |
| `filePath` / `pkFile` | 下载链接，PDF 不输出 |
| `attachmentSource` / `uploadUserId` | 页面不展示 |
| 下载图标 / 上传 / 删除 / 同步按钮 | 页面交互 |

---

## 四、整合流程

```text
1. 读取 L1 写死的 ATTACHMENT_SECTION_DEFS
2. 遍历 attachmentList，按 documentDir.name 归入对应分区
3. 每个分区始终输出（无文件时 files=[]）
4. 分区内文件按入参顺序保留
5. 输出 moduleIndex=14 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- 分区副标题：该分区 `documentDir` 用中文逗号 `，` 拼接
- 归组键：`documentDir.name` 精确匹配写死列表；未匹配任何分区的附件 **不展示**
- 空分区：仍输出 Card 标题 + 副标题，文件区留空（对齐页面「中登报送」空态）
- PDF **不输出**下载图标与任何操作按钮

---

## 六、blocks 组装顺序

| 顺序 | blockKey | displayType | 说明 |
| :--: | -------- | ----------- | ---- |
| 1 | `attachmentSections` | `attachmentSections` | 全部固定分区 |

**attachmentSections.sections[]：**

| 字段 | 说明 |
| ---- | ---- |
| `modelName` | 分区标题 |
| `documentDirDesc` | 副标题（文档类型拼接） |
| `files[]` | `{ fileName, documentType, uploadTime }` |

---

## 七、文件卡片字段

| 展示 | 接口字段 |
| ---- | -------- |
| 文件名 | `fileName` |
| 文件类型 | `documentDir.name` |
| 上传时间 | `uploadTime` |

---

## 八、样式约定（L2 扩展 · mock-to-html 已实现）

- 分区：左侧蓝色竖条标题 + 灰色副标题 + 底部分隔线
- 文件：3 列网格卡片；浅底、圆角；无下载图标
- 正式 L2 扩展见后续 `prjc_style_render` 迭代

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 14,
  "moduleName": "附件信息",
  "moduleKey": "attachments",
  "blocks": [
    {
      "blockKey": "attachmentSections",
      "displayType": "attachmentSections",
      "sections": [
        {
          "modelName": "基础材料",
          "documentDirDesc": "营业执照，自然人身份证明，公司章程，开户许可证，开票资料",
          "files": [
            {
              "fileName": "营业执照.jpg",
              "documentType": "营业执照",
              "uploadTime": "2026-08-28 14:25:15"
            }
          ]
        }
      ]
    }
  ]
}
```
