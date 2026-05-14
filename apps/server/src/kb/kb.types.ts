export interface TreeArticle {
  type: 'article'
  name: string
  title: string
  path: string
  updatedAt: string
}

export interface TreeDirectory {
  type: 'directory'
  name: string
  path: string
  children: TreeItem[]
}

export type TreeItem = TreeArticle | TreeDirectory

export interface Article {
  path: string
  title: string
  content: string
  updatedAt: string
}

export interface SearchHit {
  path: string
  title: string
  snippet: string
  score: number
}
