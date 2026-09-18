const STYLE_ID = 'kaluga-preloader-styles'
const ROOT_ID = 'kaluga-preloader-root'

class Preloader {
  #ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return
    }

    const link = document.createElement('link')
    link.id = STYLE_ID
    link.rel = 'stylesheet'
    link.href = new URL('../../assets/style/preloader.css', import.meta.url).href

    document.head.append(link)
  }

  startPreloader() {
    this.endPreloader()
    this.#ensureStyles()

    const root = document.createElement('div')
    root.id = ROOT_ID
    root.className = 'kaluga-preloader'
    root.setAttribute('role', 'status')
    root.setAttribute('aria-live', 'polite')
    root.setAttribute('aria-label', 'Загрузка')

    const spinner = document.createElement('div')
    spinner.className = 'kaluga-preloader__spinner'
    root.append(spinner)

    document.body.append(root)
  }

  endPreloader() {
    document.getElementById(ROOT_ID)?.remove()
  }
}

export default Preloader
