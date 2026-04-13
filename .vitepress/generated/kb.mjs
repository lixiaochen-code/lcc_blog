export const kbNav = [
  {
    "text": "首页",
    "link": "/"
  },
  {
    "text": "知识库",
    "link": "/notes/"
  },
  {
    "text": "AI 工作台",
    "link": "/ai/"
  }
];

export const kbSidebar = {
  "/notes/": [
    {
      "text": "总览",
      "items": [
        {
          "text": "知识库目录",
          "link": "/notes/"
        }
      ]
    },
    {
      "text": "开始使用",
      "items": [
        {
          "text": "dev-flow-owner-note",
          "link": "/notes/inbox/dev-flow-owner-note"
        },
        {
          "text": "知识库开始使用",
          "link": "/notes/inbox/getting-started"
        },
        {
          "text": "项目总览",
          "link": "/notes/inbox/project-overview"
        }
      ]
    },
    {
      "text": "知识库设计",
      "items": [
        {
          "text": "对话式知识库接入设想",
          "link": "/notes/architecture/对话式知识库接入设想"
        },
        {
          "text": "服务器直部署与运行时配置",
          "link": "/notes/architecture/服务器直部署与运行时配置"
        },
        {
          "text": "生产 AI 权限与发布控制设计",
          "link": "/notes/architecture/生产AI权限与发布控制设计"
        },
        {
          "text": "Owner 授权与用户访问控制",
          "link": "/notes/architecture/owner授权与用户访问控制"
        }
      ]
    },
    {
      "text": "检索与回答",
      "items": [
        {
          "text": "智能检索约束",
          "link": "/notes/retrieval/智能检索约束"
        }
      ]
    },
    {
      "text": "前端工程化",
      "items": [
        {
          "text": "Vite 学习笔记",
          "link": "/notes/frontend/vite学习笔记"
        }
      ]
    },
    {
      "text": "开发工具",
      "items": [
        {
          "text": "AI 控制台接入说明",
          "link": "/notes/tools/开发AI工作台"
        },
        {
          "text": "Awesome APIs 中文资源总结",
          "link": "/notes/tools/awesome-apis-中文资源总结"
        },
        {
          "text": "CLIProxyAPI 项目整理",
          "link": "/notes/tools/CLIProxyAPI 项目整理"
        }
      ]
    },
    {
      "text": "网页摘录",
      "items": [
        {
          "text": "杀疯了！前端最强 10 个 AI Skills ！效率提升500%！",
          "link": "/notes/web-clips/杀疯了-前端最强-10-个-ai-skills-效率提升500"
        }
      ]
    }
  ],
  "/ai/": [
    {
      "text": "AI 工作台",
      "items": [
        {
          "text": "问答与检索",
          "link": "/ai/"
        }
      ]
    }
  ]
};

export const kbData = {
  "hero": {
    "title": "LCC Knowledge Lab",
    "tagline": "把个人笔记、检索和 AI 对话收束到同一套 Markdown-first 工作流里。"
  },
  "stats": {
    "totalNotes": 13,
    "totalSections": 6,
    "totalTags": 31,
    "totalReadingMinutes": 46
  },
  "sections": [
    {
      "id": "start",
      "title": "开始使用",
      "description": "入门说明、工作流记录和快速上手内容。",
      "count": 3
    },
    {
      "id": "design",
      "title": "知识库设计",
      "description": "知识库架构、权限和系统设计相关笔记。",
      "count": 4
    },
    {
      "id": "retrieval",
      "title": "检索与回答",
      "description": "检索策略、上下文压缩和回答约束。",
      "count": 1
    },
    {
      "id": "frontend",
      "title": "前端工程化",
      "description": "前端技术、构建工具和工程实践。",
      "count": 1
    },
    {
      "id": "tools",
      "title": "开发工具",
      "description": "外部工具、工作台和基础设施整理。",
      "count": 3
    },
    {
      "id": "web-clips",
      "title": "网页摘录",
      "description": "从外部网页抓取、整理和归档的内容。",
      "count": 1
    }
  ],
  "featured": [
    {
      "id": "inbox-project-overview",
      "title": "项目总览",
      "summary": "说明这个项目为什么存在、现在的重构方向是什么，以及它最终想提供怎样的知识库体验。",
      "url": "/notes/inbox/project-overview",
      "sectionTitle": "开始使用",
      "updatedAt": "2026-04-14T00:00:00.000Z"
    },
    {
      "id": "tools-awesome-apis-中文资源总结",
      "title": "Awesome APIs 中文资源总结",
      "summary": "Awesome APIs 中文资源总结 这是一个名为“Awesome APIs”的GitHub仓库的中文README文件，旨在为开发者收集和整理各类优秀的API资源。 核心目的 ： 收集和分类“非常好的API”，方便开发者查找和集成。 鼓…",
      "url": "/notes/tools/awesome-apis-中文资源总结",
      "sectionTitle": "开发工具",
      "updatedAt": "2026-04-08T16:41:44.792Z"
    },
    {
      "id": "inbox-getting-started",
      "title": "知识库开始使用",
      "summary": "通过开发工作台更新的摘要。",
      "url": "/notes/inbox/getting-started",
      "sectionTitle": "开始使用",
      "updatedAt": "2026-04-08T05:41:57.887Z"
    },
    {
      "id": "inbox-dev-flow-owner-note",
      "title": "dev-flow-owner-note",
      "summary": "dev flow owner note This note is created from the local AI dev workflow.",
      "url": "/notes/inbox/dev-flow-owner-note",
      "sectionTitle": "开始使用",
      "updatedAt": "2026-04-08T05:38:01.797Z"
    },
    {
      "id": "tools-cliproxyapi-项目整理",
      "title": "CLIProxyAPI 项目整理",
      "summary": "CLIProxyAPI 是一个把多种 AI CLI 能力包装成兼容 OpenAI、Gemini、Claude、Codex 接口的代理服务，适合把 OAuth 登录得到的 CLI 能力统一暴露成 API。",
      "url": "/notes/tools/CLIProxyAPI 项目整理",
      "sectionTitle": "开发工具",
      "updatedAt": "2026-04-08T03:40:00.000Z"
    },
    {
      "id": "frontend-vite学习笔记",
      "title": "Vite 学习笔记",
      "summary": "整理 Vite 中常见的 CSS 配置、路径解析、打包配置与插件示例，方便后续按主题检索。",
      "url": "/notes/frontend/vite学习笔记",
      "sectionTitle": "前端工程化",
      "updatedAt": "2026-04-08T03:20:00.000Z"
    }
  ],
  "tags": [
    {
      "name": "部署",
      "count": 1
    },
    {
      "name": "代理服务",
      "count": 1
    },
    {
      "name": "低token",
      "count": 1
    },
    {
      "name": "对话",
      "count": 1
    },
    {
      "name": "发布",
      "count": 1
    },
    {
      "name": "工作流",
      "count": 3
    },
    {
      "name": "构建工具",
      "count": 1
    },
    {
      "name": "检索",
      "count": 2
    },
    {
      "name": "开发资源",
      "count": 1
    },
    {
      "name": "控制台",
      "count": 1
    },
    {
      "name": "配置",
      "count": 1
    },
    {
      "name": "前端",
      "count": 1
    },
    {
      "name": "前端工程化",
      "count": 1
    },
    {
      "name": "权限",
      "count": 3
    },
    {
      "name": "微信",
      "count": 1
    },
    {
      "name": "项目概览",
      "count": 1
    },
    {
      "name": "用户",
      "count": 1
    },
    {
      "name": "知识库",
      "count": 7
    },
    {
      "name": "AI",
      "count": 7
    },
    {
      "name": "AI 工具",
      "count": 1
    },
    {
      "name": "api",
      "count": 1
    },
    {
      "name": "awesome-list",
      "count": 1
    },
    {
      "name": "Claude",
      "count": 1
    },
    {
      "name": "Codex",
      "count": 2
    }
  ]
};
