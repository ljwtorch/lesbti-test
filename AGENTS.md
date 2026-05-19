# AGENTS.md

## 项目约束

- 包管理器必须使用 `pnpm`。
- 技术栈应使用 `Vite + React + TypeScript`。
- 应优先采用数据驱动结构，题库与结果内容来自本仓库本地 JSON，而不是写死在组件里。
- 答题主流程应与参考项目基本一致，至少包含 `landing`、`quiz`、`result` 三个视图，以及本地进度持久化能力。
- 结果模型必须基于当前仓库的 `LesBTI` 文档与题库，输出主结果、8 维关系维度和派生气场条。

## 内容约束

- 必须遵循 [docs/lesbti-relationship-gas-spec.md](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-gas-spec.md) 中的产品定位与文案边界。
- 必须使用 [docs/lesbti-relationship-bank.v1.json](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-bank.v1.json) 作为当前版本题库的事实来源。
- 不应把结果描述写成身份诊断或医学心理判断，应明确保持“关系气场 / 互动倾向”的表达。

## UX 约束

- 答题逻辑参考附件项目，但 UI、配色和视觉风格应服务于当前项目“关系气场”的定位，避免直接复刻参考项目的视觉表达。
- 页面需要从首版开始同时兼顾桌面端与移动端体验。
- 风格应具有正式产品质感，同时保留情绪氛围与传播感，不做纯文档式页面。

## 实现说明

- 工程结构建议保持与参考项目接近：
  - `data/question-banks/`
  - `src/testEngine.ts`
  - `src/App.tsx`
- 如新增可视化模块，可继续扩展 `src/` 下的工具文件，但应保持实现简洁、可维护。
