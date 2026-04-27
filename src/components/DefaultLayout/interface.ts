import type {
  ScrollViewOnScrolltolowerEvent,
  ScrollViewOnScrolltoupperEvent,
} from '@uni-helper/uni-app-types'
export interface EmitsType {
  (e: 'scrollToBottom', event: ScrollViewOnScrolltolowerEvent): void
  (e: 'scrollToTop', event: ScrollViewOnScrolltoupperEvent): void
}

export interface PropsType {
  loading?: boolean
  loadingText?: string
}

export interface ExposeType {
  handleScrollToTop: () => void
  handleScrollTo: (position: number) => void
}
