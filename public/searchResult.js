import TvTitlePage from './tvTitlePage.js'
import MovieTitlePage from './movieTitlePage.js'

const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <a #card class="card">
        <div class="card-image">
            <img #cardimage />
            <span class="card-title">#title</span>
        </div>
    </a>
`
function SearchResult(result, state, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {card, cardimage, title} = view.collect(root)

    title.nodeValue = `${result.title || result.name}${result.release_date ? ` (${(new Date(result.release_date)).getFullYear()})` : ''}`

    if (result.poster_path) {
        cardimage.src = `https://image.tmdb.org/t/p/w200${result.poster_path}`
    }

    var height = 0;
    var range = document.createRange();
    var parentNode = title.parentNode
    var parentRect = parentNode.getBoundingClientRect()
    var parentHeight = parentRect.height
    var childNode = title
    parentNode.style['font-size'] = parentNode.style['font-size'] || "14px"
    range.selectNodeContents(childNode);
    var rect = range.getBoundingClientRect();
    height = rect.height;
    while (height > parentHeight) {
      parentNode.style['font-size'] = parseFloat(parentNode.style['font-size'], 10) - 0.01 + "px"
      rect = range.getBoundingClientRect();
      height = rect.height;
      console.log(height, parentNode.style['font-size'])
    }

    card.onclick = () => {
        state.selectedTitle = result
        state.selectedTitle.similarResults = []
        // history.pushState({}, '', `/${result.id}`)
        if (result.media_type === 'tv') {
            context.navigate(TvTitlePage)
            } else {
                context.navigate(MovieTitlePage)
            }
        }

        root.update = function() {
            console.log('Rendered SearchResult')
        }

        return root
    }

    export default SearchResult