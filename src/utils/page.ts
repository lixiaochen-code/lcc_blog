import pagesJson from '@/pages.json'

/** 获取当前页面路由 */
export const getCurrentPageRoute = () => {
  const pages = getCurrentPages()
  if (pages.length === 0) return ''
  const currentPage = pages[pages.length - 1]
  return currentPage.route
}

/**
 * 获取当前页面的 pages.json 配置信息
 */
export const getCurrentPageData = () => {
  const currentRoute = getCurrentPageRoute()

  if (!currentRoute) return null

  // 查找主包 (pages)
  let pageConfig = pagesJson.pages.find(item => item.path === currentRoute)

  // 查找分包 (subPackages)
  if (!pageConfig && pagesJson.subPackages) {
    for (const sub of pagesJson.subPackages) {
      const found = sub.pages.find(item => {
        const fullPath = `${sub.root}/${item.path}`
        return fullPath === currentRoute
      })
      if (found) {
        pageConfig = found
        break
      }
    }
  }

  return pageConfig || null
}

/** 当前页面是否为TabBar页面 */
export const getCurrentPageIsTabBar = () => {
  const currentPageRoute = getCurrentPageRoute()
  const tabbarList = pagesJson?.tabBar?.list
  if (!currentPageRoute || !tabbarList?.length) return false
  return tabbarList.some(item => item.pagePath === currentPageRoute)
}
