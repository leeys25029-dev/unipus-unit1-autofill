# unipus-unit1-autofill

新探索研究生英语（提高级）读写教程：答案文档和填充脚本。

## 范围

- `读写提高级U校园答案/`：U1–U6 原始答案文档。
- `build_unit1.py`：从 U1 DOCX 生成答案 JSON 和独立脚本，无第三方 Python 依赖。
- `test-unit1.cjs`：离线模拟 DOM 测试，需要 Node.js 18 或更新版本。

不是整个课程的一键完成工具。只填写当前支持的练习，不翻页、不提交、不播放视频，不读取登录信息。加载脚本后先执行 `UnipusUnit1.preview()`，再执行 `await UnipusUnit1.fill()`。

```sh
python3 build_unit1.py
node --test test-unit1.cjs
```

真实 Safari 页面已逐题填充核对 8 个词汇答案及 4 个翻译答案，未提交。控制台脚本本身尚未在真实 Safari DOM 上执行验证；8 项离线测试不替代浏览器兼容性测试。

完整操作说明、安全边界和验证记录见 [README-自动填充.md](README-自动填充.md)。

使用者需遵守课程规则及平台条款。答案文档可能涉及教材版权，分享者应确认分发权限。本仓库未附加开源许可证，也不对第三方教材内容授予使用权。
