# PrivyRep Logo Design

## 🎨 设计理念

PrivyRep 的 Logo 融合了项目的核心概念：

### 视觉元素

1. **🛡️ 盾牌 (Shield)**
   - 象征：隐私保护、安全防护
   - 位置：中心主体
   - 含义：保护用户的敏感身份信息

2. **🔒 锁 (Lock)**
   - 象征：加密、安全性
   - 位置：盾牌内部
   - 含义：FHE 加密技术，数据始终保持加密状态

3. **⭐ 三颗星星 (Three Stars)**
   - 象征：声誉评分、信誉等级
   - 位置：盾牌下方
   - 含义：用户通过验证获得的链上声誉

4. **🔷 六边形图案 (Hexagon Pattern)**
   - 象征：区块链、去中心化网络
   - 位置：背景装饰
   - 含义：FHE 加密的数学结构和区块链网络

### 色彩方案

- **主色调**: 蓝色渐变 (#3B82F6 → #1D4ED8)
  - 代表：信任、专业、技术、安全

- **辅助色**: 白色
  - 代表：纯净、透明、隐私保护

- **强调色**: 金黄色 (#FCD34D)
  - 代表：声誉、成就、价值

## 📁 文件列表

### 主要 Logo 文件
- `logo.svg` - 完整版 Logo (200x200px)
- `favicon.svg` - 简化版 Favicon (32x32px)

### 使用场景

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `logo.svg` | 200x200 | 网站头部、GitHub README、文档 |
| `favicon.svg` | 32x32 | 浏览器标签页图标 |

## 🔧 技术规格

- **格式**: SVG (矢量图，可无限缩放)
- **颜色模式**: RGB
- **背景**: 透明 / 渐变背景
- **兼容性**: 所有现代浏览器

## 💡 使用建议

### 在 README 中使用

```markdown
<p align="center">
  <img src="privyrep-frontend/public/logo.svg" alt="PrivyRep Logo" width="150"/>
</p>

# PrivyRep - Privacy-First Identity & Reputation System
```

### 在 HTML 中使用

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Logo in Header -->
<img src="/logo.svg" alt="PrivyRep" width="120" />
```

### 在 React 中使用

```tsx
import logo from '/logo.svg';

function Header() {
  return (
    <img src={logo} alt="PrivyRep" className="w-32 h-32" />
  );
}
```

## 🎯 设计变体

### 深色背景版本
Logo 已设计为在深色和浅色背景上都能良好显示。

### 单色版本
如需单色版本（如打印），可以使用：
- 纯蓝色版本
- 纯白色版本
- 纯黑色版本

## 📐 尺寸指南

### 推荐尺寸

| 使用场景 | 推荐宽度 |
|---------|---------|
| 网站头部 | 120-150px |
| GitHub README | 150-200px |
| 社交媒体头像 | 400x400px |
| Favicon | 32x32px |
| 应用图标 | 512x512px |

### 最小尺寸
- 建议不小于 32x32px
- 小于此尺寸时细节可能不清晰

## 🎨 品牌指南

### Logo 使用规范

✅ **允许**:
- 按比例缩放
- 在深色/浅色背景使用
- 与项目名称组合使用

❌ **禁止**:
- 扭曲或拉伸
- 改变颜色（除非制作单色版本）
- 添加阴影或特效
- 旋转或倾斜

## 🔄 更新日志

- **v1.0** (2025-10-30): 初始设计发布
  - 创建主 Logo (logo.svg)
  - 创建 Favicon (favicon.svg)
  - 确立设计理念和色彩方案

---

**设计**: PrivyRep Team
**日期**: 2025-10-30
**版本**: 1.0
