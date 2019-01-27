import TvTitlePage from './tvTitlePage.js'
import MovieTitlePage from './movieTitlePage.js'

const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <div #card class="search-result-card-image mdl-card mdl-shadow--2dp">
        <div class="mdl-card__title mdl-card--expand"></div>
        <div class="mdl-card__actions">
            <span class="search-result-card-image__filename">#title</span>
        </div>
    </div>
`
function SearchResult(result, state, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {card, title} = view.collect(root)

    title.nodeValue = `${result.title || result.name}${result.release_date ? ` (${(new Date(result.release_date)).getFullYear()})` : ''}`

    if (result.poster_path) {
        card.style.background = `url('https://image.tmdb.org/t/p/w500${result.poster_path}') center / cover`
    }

    card.onclick = () => {
        state.selectedTitle = result
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