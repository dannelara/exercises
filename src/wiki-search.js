const searchUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&origin=*&search='
const extractUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=200&explaintext&redirects=1&format=json&origin=*&titles='
const template = document.createElement('template')

template.innerHTML = `
<style>
:host{
    text-align: center;
}
.hidden {
    display: none;
}
</style>

<form action="search" id="form">
    <input type="search" id="searchInput" placeholder="Search me!" autocomplete="off" list="dataList">
    <input type="submit" value="Click me!">
    <datalist id="dataList"></datalist>
  </form>
  <article id="result" class="hidden">
    <h1 id="title">
    </h1>
    <p id="extract"> <a id='link'>...more</a></p>
  </article>
  <article id="no-results" class="hidden">
    <p>No Results found! Try again!</p>
  </article>
`
/**
 *
 */
class myWiki extends HTMLElement {
  /**
   *
   */
  constructor () {
    super()
    this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true))
    this._input = this.shadowRoot.querySelector('#searchInput')
    this._form = this.shadowRoot.querySelector('#form')
    this._list = this.shadowRoot.querySelector('datalist')
    this._onInput = this._onInput.bind(this)
    this._onSubmit = this._onSubmit.bind(this)
  }

  /**
   *
   */
  connectedCallback () {
    this._input.addEventListener('input', this._onInput)
    this._form.addEventListener('submit', this._onSubmit)
  }

  /**
   *
   */
  disconnectedCallback () {
    this._input.removeEventListener('input', this._onInput)
    this._form.removeEventListener('submit', this._onSubmit)
  }

  // method to onInput
  /**
   *
   */
  async _onInput () {
    this._input.blur()
    this._input.focus()
    const respons = await this._searchOptions(this._input.value)
    this._renderOptions(respons)
  }

  /**
   * @param event
   */
  async _onSubmit (event) {
    event.preventDefault()
    const article = await this._getExtract(this._input.value)
    this._renderExtract(article)
  }

  // method onSubmit
  // method that sends a get request
  /**
   * @param url
   * @param searchString
   */
  async _getReq (url, searchString) {
    const respons = await fetch(`${url}${encodeURIComponent(searchString)}`)
    return respons.json()
  }

  // method to get input searches
  /**
   * @param searchString
   */
  async _searchOptions (searchString) {
    const articles = []
    if (searchString.length > 0) {
      const [, names, , url] = await this._getReq(searchUrl, searchString)
      if (names && url) {
        for (let i = 0; i < names.length; i++) {
          articles.push({
            name: names[i],
            url: url[i]
          })
        }
      }
    }
    return articles
  }

  // method to get extract/onSubmit
  /**
   * @param searchString
   */
  async _getExtract (searchString) {
    const respons = await this._getReq(extractUrl, searchString.trim())
    return Object.values(respons.query.pages).shift()
  }

  // method to render the searchOptions
  /**
   * @param articles
   */
  _renderOptions (articles) {
    while (this._list.firstChild) {
      this._list.removeChild(this._list.lastChild)
    }
    if (articles.length > 0) {
      const fragment = document.createDocumentFragment()
      for (const { name, url } of articles) {
        const option = document.createElement('option')
        option.value = name
        option.setAttribute('data-url', url)
        fragment.appendChild(option)
      }
      this._list.appendChild(fragment)
    }
  }

  // method to render the extract
  /**
   * @param article
   */
  _renderExtract (article) {
    const articleResult = this.shadowRoot.querySelector('#result')
    const articleNoResult = this.shadowRoot.querySelector('#no-results')
    const title = this.shadowRoot.querySelector('#title')
    const extract = this.shadowRoot.querySelector('#extract')
    const link = this.shadowRoot.querySelector('#link')
    if (article.extract) {
      articleResult.classList.remove('hidden')
      articleNoResult.classList.add('hidden')
      title.textContent = article.title
      link.setAttribute('href', this._list.querySelector(`option[value="${article.title}"]`).getAttribute('data-url'))
      extract.insertBefore(document.createTextNode(article.extract), link)
    } else {
      articleResult.classList.add('hidden')
      articleNoResult.classList.remove('hidden')
    }
  }
}

window.customElements.define('wiki-search', myWiki)
