import TvTitlePage from './tvTitlePage.js'
import MovieTitlePage from './movieTitlePage.js'

const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <div #card class="search-result-card-image mdl-card mdl-shadow--2dp">
        <div #titlecontainer class="mdl-card__actions">
            <span class="search-result-card-image__filename">#title</span>
        </div>
    </div>
`
function SearchResult(result, state, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {card, title, titlecontainer} = view.collect(root)

    title.nodeValue = `${result.title || result.name}${result.release_date ? ` (${(new Date(result.release_date)).getFullYear()})` : ''}`

    if (result.poster_path) {
        card.style.background = `url('https://image.tmdb.org/t/p/w200${result.poster_path}') center / cover`
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

        let height = 0;
        const range = document.createRange();
        const parentNode = titlecontainer
        const parentRect = parentNode.getBoundingClientRect()
        const parentHeight = parentRect.height
        title.parentNode.style['font-size'] = title.parentNode.style['font-size'] || "14px"
        range.selectNodeContents(title);
        let rect = range.getBoundingClientRect();
        height = rect.height;
        if (height > 0 && parentHeight > 0) {
            while (height > parentHeight - 10) {
                title.parentNode.style['font-size'] = parseFloat(title.parentNode.style['font-size'], 10) - 0.1 + "px"
                rect = range.getBoundingClientRect();
                height = rect.height;
            }
        }
    }

    return root
}

export default SearchResult