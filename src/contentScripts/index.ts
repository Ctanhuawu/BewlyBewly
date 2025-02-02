// import { onMessage } from 'webext-bridge'
import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'
import { i18n } from '~/utils/i18n'
import { SVG_ICONS } from '~/utils/svgIcons'

let app: any

const isFirefox: boolean = /Firefox/i.test(navigator.userAgent)

document.documentElement.style.opacity = '0'
// document.documentElement.style.transition = 'opacity .5s ease-in-out'
// document.documentElement.style.background = 'var(--bew-bg)'
if (isFirefox) {
  let isFirstScriptExecute = true
  document.addEventListener('beforescriptexecute', () => {
    if (!isFirstScriptExecute)
      return

    injectApp()
    isFirstScriptExecute = false
  })
  window.onload = () => {
    nextTick(() => {
      setTimeout(() => {
        document.documentElement.style.opacity = '1'
      }, 1000)
    })
  }
}
else {
  document.addEventListener('DOMContentLoaded', () => {
    injectApp()

    nextTick(() => {
      setTimeout(() => {
        document.documentElement.style.opacity = '1'
      }, 1000)
    })
  })
}

function injectApp() {
  const currentUrl = document.URL

  if (
    // homepage
    /https?:\/\/bilibili.com\/?$/.test(currentUrl)
    || /https?:\/\/www.bilibili.com\/?$/.test(currentUrl)
    || /https?:\/\/www.bilibili.com\/index.html$/.test(currentUrl)
    || /https?:\/\/bilibili.com\/\?spm_id_from=.*/.test(currentUrl)
    || /https?:\/\/www.bilibili.com\/\?spm_id_from=(.)*/.test(currentUrl)

    // video page
    || /https?:\/\/(www.)?bilibili.com\/video\/.*/.test(currentUrl)
    // watch later playlist
    || /https?:\/\/(www.)?bilibili.com\/list\/watchlater.*/.test(currentUrl)
    // favorite playlist
    || /https?:\/\/(www.)?bilibili.com\/list\/ml.*/.test(currentUrl)
    // search page
    || /https?:\/\/search.bilibili.com\.*/.test(currentUrl)
    // moments
    || /https?:\/\/t.bilibili.com\.*/.test(currentUrl)
  ) {
    if (
      /https?:\/\/bilibili.com\/?$/.test(currentUrl)
      || /https?:\/\/www.bilibili.com\/?$/.test(currentUrl)
      || /https?:\/\/www.bilibili.com\/index.html$/.test(currentUrl)
      || /https?:\/\/bilibili.com\/\?spm_id_from=.*/.test(currentUrl)
      || /https?:\/\/www.bilibili.com\/\?spm_id_from=(.)*/.test(currentUrl)
    ) {
      const originalPageContent = document.querySelector('#i_cecream')
      if (originalPageContent)
        originalPageContent.innerHTML = ''
    }

    // mount component to context window
    const container = document.createElement('div')
    container.id = 'bewly'
    const root = document.createElement('div')
    const styleEl = document.createElement('link')
    const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
    styleEl.setAttribute('rel', 'stylesheet')
    styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
    shadowDOM.appendChild(styleEl)
    shadowDOM.appendChild(root)

    const newStyleEl = document.createElement('link')
    newStyleEl.setAttribute('rel', 'stylesheet')
    newStyleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
    document.body.appendChild(newStyleEl)

    // inject svg icons
    const svgDiv = document.createElement('div')
    svgDiv.innerHTML = SVG_ICONS
    shadowDOM.appendChild(svgDiv)

    document.body.appendChild(container)
    app = createApp(App)
    setupApp(app)
    app.use(i18n).mount(root)
  }
}
