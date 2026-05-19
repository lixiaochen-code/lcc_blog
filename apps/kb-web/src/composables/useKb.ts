import { ref } from 'vue'
import { api, type Article, type TreeItem } from '../api'
import { useSession } from './useSession'

const tree = ref<TreeItem[]>([])
const activePath = ref('')
const activeArticle = ref<Article | null>(null)
const editorContent = ref('')
const editing = ref(false)
const viewMode = ref<'read' | 'admin'>('read')

async function refreshTree(): Promise<void> {
  const { session, can } = useSession()
  if (!session.value || !can('kb:view')) {
    tree.value = []
    return
  }
  const result = await api.tree()
  tree.value = result.items
}

async function loadArticle(path: string): Promise<void> {
  activePath.value = path
  activeArticle.value = await api.article(path)
  editorContent.value = activeArticle.value.content
  editing.value = false
}

async function selectArticle(path: string): Promise<void> {
  if (!path) {
    clearActiveArticle()
    return
  }
  await loadArticle(path)
}

function clearActiveArticle(): void {
  activePath.value = ''
  activeArticle.value = null
  editorContent.value = ''
  editing.value = false
}

async function startCreate(): Promise<void> {
  const path = window.prompt('请输入文章路径，例如 guide/intro.md')
  if (!path) return
  const title = path.split('/').pop()?.replace(/\.md$/, '') || '新文章'
  activeArticle.value = await api.createArticle(path, `# ${title}\n\n开始编写内容。\n`)
  activePath.value = activeArticle.value.path
  editorContent.value = activeArticle.value.content
  editing.value = true
  await refreshTree()
}

async function saveArticle(): Promise<void> {
  if (!activeArticle.value) return
  activeArticle.value = await api.updateArticle(activeArticle.value.path, editorContent.value)
  editorContent.value = activeArticle.value.content
  editing.value = false
  await refreshTree()
}

async function removeArticle(): Promise<void> {
  if (!activeArticle.value) return
  const ok = window.confirm(
    `确认删除 ${activeArticle.value.path}？该操作会直接删除 Markdown 文件。`
  )
  if (!ok) return
  await api.deleteArticle(activeArticle.value.path)
  clearActiveArticle()
  await refreshTree()
}

/** Knowledge-base navigation and edit state. Module-level singleton. */
export function useKb() {
  return {
    tree,
    activePath,
    activeArticle,
    editorContent,
    editing,
    viewMode,
    refreshTree,
    loadArticle,
    selectArticle,
    clearActiveArticle,
    startCreate,
    saveArticle,
    removeArticle,
  }
}
