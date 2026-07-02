import { useEffect } from 'react'

interface MetaTagsOptions {
  title?: string
  description?: string
  image?: string
  canonicalPath?: string
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Keeps document.title, meta description, Open Graph/Twitter tags, and canonical link in sync with the current page. */
export function useMetaTags({ title, description, image, canonicalPath }: MetaTagsOptions) {
  useEffect(() => {
    if (title) {
      document.title = title
      upsertMeta('property', 'og:title', title)
      upsertMeta('name', 'twitter:title', title)
    }
    if (description) {
      upsertMeta('name', 'description', description)
      upsertMeta('property', 'og:description', description)
      upsertMeta('name', 'twitter:description', description)
    }
    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
      upsertMeta('name', 'twitter:card', 'summary_large_image')
    }
    if (canonicalPath) {
      const href = `${window.location.origin}${canonicalPath}`
      upsertCanonical(href)
      upsertMeta('property', 'og:url', href)
    }
  }, [title, description, image, canonicalPath])
}
