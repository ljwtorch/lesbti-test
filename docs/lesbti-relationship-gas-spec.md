# 女同关系气场测试策划稿

## 1. 项目定位

这套题目更适合定义为“关系气场 / 关系风格自测”，不建议定义为身份鉴定、性取向判定或任何医学心理诊断。

建议最终页面输出三层结果：

1. 主结果类型：给用户一个高辨识度的关系风格标签。
2. 8 维雷达图：展示关系里的具体侧面，而不是只给一个结论。
3. 派生气场条：用 4 到 6 个更轻量的标签表达结果气质，比如“直球感”“掌控感”“妹感”“姐感”“稳定感”。

这样既能保留传播性，也能降低“标签过死”的风险。

## 2. 公开研究与案例素材范围

本项目应只抽取“可归纳的结构信息”，不直接复用论文题项、商业测试题文案、短视频测试原句或结果描述。

### 可采纳的研究方向

- 成人依恋二维结构：焦虑、回避。
- 关系质量常见指标：信任、满意度、承诺、修复能力、支持感。
- 少数压力相关变量：披露压力、内化污名、外部歧视、社会支持。
- 互动风格变量：表达直接度、边界管理、照顾倾向、主导倾向、亲密节奏。
- 性别表达相关研究：只能作为“社会互动经验差异”的背景，不应直接推导身份。

### 本次整理可参考的公开来源

- [PubMed 40001836](https://pubmed.ncbi.nlm.nih.gov/40001836/)
  主题：少数压力、依恋维度与关系质量。
  用途：支持“安全感 / 拉扯感 / 修复力”设计。

- [PubMed 39552623](https://pubmed.ncbi.nlm.nih.gov/39552623/)
  主题：少数压力、伴侣间共同应对与关系满意度。
  用途：支持“修复协作 / 稳定度 / 支持系统”设计。

- [PubMed 28695154](https://pubmed.ncbi.nlm.nih.gov/28695154/)
  主题：披露、社会参与和女同关系质量。
  用途：支持“公开边界 / 社交整合 / 稳定投入”设计。

- [PubMed 31407194](https://pubmed.ncbi.nlm.nih.gov/31407194/)
  主题：女性指派出生伴侣关系中的亲密和关系功能差异。
  用途：支持“亲密同步 / 情感深度 / 身体与情绪节奏”设计。

- [PubMed 40777186](https://pubmed.ncbi.nlm.nih.gov/40777186/)
  主题：少数压力与关系满意度的关联。
  用途：支持“外部环境压力会影响关系气场”的说明。

- [PubMed 28239508](https://pubmed.ncbi.nlm.nih.gov/28239508/)
  主题：女性同性爱侣关系中的风险、满意度与边界议题。
  用途：提醒结果设计里要保留“安全边界”维度，不美化控制或失衡。

- [PubMed 33645322](https://pubmed.ncbi.nlm.nih.gov/33645322/)
  主题：性别不一致/非规范化表达与少数压力。
  用途：提醒产品避免把外表气质直接写成身份结论。

### 版权与专利规避参考

- [US Copyright Office Compendium](https://www.copyright.gov/comp3/docs/compendium.pdf)
  用途：支持“事实、概念、短语本身不受版权保护，但具体表达受保护”的改写原则。

- [USPTO Subject Matter Eligibility Guidance](https://www.uspto.gov/web/offices/pac/mpep/documents/2100_2106_04.htm)
  用途：提醒不要把“测试规则 + 页面样式 + 文案口吻”照搬成与现成产品高度同构的实现。

## 3. 内容改写原则

### 允许借鉴的层

- 借鉴研究中的抽象维度。
- 借鉴“题目 -> 维度分数 -> 结果画像”的结构。
- 借鉴“雷达图 + 主结果卡 + 补充标签条”的结果展示思路。

### 不建议直接复用的层

- 现成量表原始题项文本。
- 社区流行测试中的原句、原标签、原结果段落。
- 某个现成页面的视觉布局、色彩和文案节奏。

### 上线时的安全表述

- 把“你就是 X”改成“你在关系里更像 X 风格”。
- 把“身份标签”改成“互动倾向”或“关系气场”。
- 把“控制”改成“主导 / 节奏引导 / 决策推进”。
- 把“服从”改成“配合度 / 被照顾舒适度 / 跟随感”。

## 4. 建议的数据驱动架构

参考 [ljwtorch/attachment-style-test](https://github.com/ljwtorch/attachment-style-test) 的分层思路，本项目建议采用：

```text
data/
  question-banks/
    lesbti-relationship-bank.v1.json

src/
  testEngine.ts
  resultRenderer.ts
  radar.ts
```

推荐核心字段：

- `schema_version`
- `bank_id`
- `version`
- `locale`
- `title`
- `subtitle`
- `notices`
- `dimensions`
- `profiles`
- `derived_bars`
- `scoring`
- `questions`
- `references`

## 5. 结果模型建议

### 5.1 8 维雷达轴

- `traction`：牵引张力
  含义：靠近、拉扯、推进关系的主动能量。

- `boundary`：边界清晰
  含义：能否说清楚公开范围、社交限度、私人空间和不舒服点。

- `leadership`：主导感
  含义：在决策、邀约、推进、处理问题时是否倾向引导节奏。

- `directness`：直球表达
  含义：表达喜欢、不满、需要和确认需求时是否直接。

- `empathy`：共情柔软
  含义：是否习惯从对方情绪和处境出发，先接住再讨论。

- `care`：照顾倾向
  含义：是否主动观察、照料、安抚、安排细节。

- `stability`：关系稳定
  含义：在节奏、承诺、修复和持续投入上是否稳定。

- `depth`：情感深度
  含义：是否倾向进入更深的情感连接和高浓度亲密。

### 5.2 主结果类型

建议不要直接使用单一社区黑话作为唯一结果，而是使用可原创表达的 4 类主结果：

- `direct_push`
  标签：直球推进型
  核心：主动、直接、能快速拉近关系。

- `soft_lead`
  标签：温柔掌舵型
  核心：外在柔和，但在关系节奏和照顾细节上有稳定引导力。

- `reverse_gap`
  标签：反差掌控型
  核心：表面像在配合，实际对情绪和节奏有较强掌控。

- `high_sensitive`
  标签：高敏拉扯型
  核心：情感浓度高、感受细、容易在靠近与顾虑间来回摇摆。

### 5.3 派生条形标签

这些不是主结果，只是结果页附加显示：

- `mei_energy`：妹感
- `jie_energy`：姐感
- `s_energy`：主导感
- `m_energy`：跟随感
- `steady_energy`：稳定感
- `spark_energy`：直球感

这些条可以由多个雷达维度加权得出，不要让任意单题直接决定身份。

### 5.4 气场外壳样本

这些不是科学分类，而是结果页包装时可以使用的原创“风格壳”：

- `稳场姐姐`
  高 `jie_energy`、高 `steady_energy`、中高 `care`。

- `软糯直球`
  高 `spark_energy`、高 `mei_energy`、中高 `traction`。

- `反差拿捏`
  高 `leadership`、高 `boundary`、中高 `empathy`。

- `高敏依偎`
  高 `depth`、高 `empathy`、高 `traction`。

- `清醒慢热`
  高 `boundary`、高 `stability`、低到中 `directness`。

- `温柔护航`
  高 `care`、高 `stability`、中高 `soft_lead` 倾向。

如果后续你想做得更“社群梗化”，也建议把这些只当作显示层别名，而不是直接把 `T/P/H`、`姐/妹`、`S/M` 等社区标签写成唯一主结论。

## 6. 评分逻辑建议

### 6.1 主结果计算

- 每道题 4 个选项。
- 每个选项映射到 1 个主结果类型。
- 同时为 8 个雷达维度增加 0 到 3 分。
- 最终先按主结果票数确定主类型。
- 如果票数接近，则用雷达组合做 tie-break。

### 6.2 派生标签计算

示例：

- `mei_energy = empathy * 0.35 + care * 0.35 + directness * 0.1 + traction * 0.2`
- `jie_energy = leadership * 0.35 + stability * 0.25 + boundary * 0.2 + care * 0.2`
- `s_energy = leadership * 0.45 + directness * 0.25 + traction * 0.2 + boundary * 0.1`
- `m_energy = empathy * 0.3 + depth * 0.25 + care * 0.25 + traction * 0.2`
- `steady_energy = stability * 0.5 + boundary * 0.2 + care * 0.15 + empathy * 0.15`
- `spark_energy = directness * 0.45 + traction * 0.35 + depth * 0.2`

## 7. 题目设计要求

### 7.1 题目数量

- 至少 35 道。
- 建议固定 35 道，先不要随机抽题，方便首版调试。

### 7.2 题目风格

- 全部使用生活场景题。
- 避免抽象自评题，如“我通常很独立”。
- 优先写成“当 X 发生时，你更可能怎么做？”

### 7.3 单题结构

- 1 个场景题干。
- 4 个选项。
- 每个选项都尽量“看起来合理”，避免明显优劣导向。

## 8. 最终上线文案建议

- 页面标题可以用“测测你的关系气场”。
- 副标题用“基于互动节奏、边界感与亲密表达的风格测试”。
- 结果页加一句固定声明：
  “结果仅供自我探索与关系反思，不构成心理诊断、医疗建议或真实身份判定。”

## 9. 本仓库当前建议落地文件

- [docs/lesbti-relationship-gas-spec.md](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-gas-spec.md)
- [docs/lesbti-relationship-bank.v1.json](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-bank.v1.json)
