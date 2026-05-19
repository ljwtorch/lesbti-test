# Findings

## Reference Project

- `attachment-style-test` 使用 `Vite + React + TypeScript`。
- 核心流程由 `src/App.tsx` 管理，包含首页、答题页、结果页、结果继续查看、测试进度持久化。
- `src/testEngine.ts` 负责题目抽取、选项计票、结果分布与 tie-break 逻辑。

## Current Project

- 当前仓库只有文档与题库，尚未存在可运行前端代码。
- [docs/lesbti-relationship-gas-spec.md](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-gas-spec.md) 定义了产品定位、8 个维度、4 个主结果与 6 个派生条。
- [docs/lesbti-relationship-bank.v1.json](/Users/lijuwei/Documents/workspace/lesbti-test/docs/lesbti-relationship-bank.v1.json) 已包含 35 道题、结果文案、评分权重与展示文案。

## Implementation Direction

- 将题库复制到 `data/question-banks/` 供前端直接引用，保持与参考项目相近的数据分层。
- 页面风格不沿用参考项目的浅粉蓝极简风，而改为更契合“关系气场”的暖色、层次化、轻 editorial 风格。
- 在结果页增加 8 维条形/雷达可视化与 6 个派生气场条，体现当前项目差异化。

## Verification Notes

- `TypeScript` 类型检查通过。
- `vite build --configLoader runner` 构建通过。
- Vite 默认缓存写入 `node_modules/.vite*` 在当前沙箱里会触发权限问题，因此将缓存目录改到项目根下的 `.vite-cache/`。
- 内置浏览器无法直接访问 `file://` 产物页，且本地监听端口受沙箱限制，因此未完成浏览器点击流验收。
