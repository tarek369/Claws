import Genre from './genre.js'
// import SimilarResult from './similarResult.js'
import SearchResult from './searchResult.js'
import reconcile from './reconcile.js'

const {h, keyed} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <div>
        <h1>#title</h1>
        <h4><i class="material-icons">star</i>#subheader</h4>
        <div #genrelist class="genres-container"></div>
        <p>#description</p>
        <h4>Similar Movies</h4>
        <div #similarlist class="flex wrap"></div>
    </div>
`
function MovieTitlePage(state, context, action) {
    const root = view

    // Collect references to dynamic parts
    const {title, subheader, genrelist, description, similarlist} = view.collect(root)

    if (!state.lastSelectedTitle) {
        state.lastSelectedTitle = {genre_ids: [], similarResults: []}
    }

    async function update() {
        console.log('Rendered MovieTitlePage', action)

        // console.log(state.lastSelectedTitle, state.selectedTitle)

        // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
        console.log(state.lastSelectedTitle.id, state.selectedTitle.id, state.selectedTitle.similarResults)
        if (state.lastSelectedTitle.id !== state.selectedTitle.id || !state.selectedTitle.similarResults || !state.selectedTitle.similarResults.length) {
            console.log('Fetching similar titles!')
            const response = await new Promise((resolve) => fetchSimilarResults(resolve, state.selectedTitle.id, 1))
            state.selectedTitle.similarResults = response.results
        }

        title.nodeValue = state.selectedTitle.title || state.selectedTitle.name
        subheader.nodeValue = `${state.selectedTitle.vote_average || 0} (${state.selectedTitle.vote_count})${state.selectedTitle.release_date ? ` | ${(new Date(state.selectedTitle.release_date)).getFullYear()}` : ''}`
        console.log(description)
        description.nodeValue = state.selectedTitle.overview

        keyed(
            'id',
            genrelist,
            state.lastSelectedTitle.genre_ids.map(genreId => ({id: genreId})),
            state.selectedTitle.genre_ids.map(genreId => ({id: genreId})),
            genreId => Genre(genreId, context),
            (Component, genreId) => Component.update(genreId)
        )

        keyed(
            'id',
            similarlist,
            state.lastSelectedTitle.similarResults.slice(),
            (state.selectedTitle.similarResults || []).slice(),
            // This assumes similar results are of the same media type (movie, tv)
            result => SearchResult(result, state, {navigate: update}),
            (Component, result) => Component.update()
        )

        state.lastSelectedTitle = state.selectedTitle
    }

    update()

    return root
}

export default MovieTitlePage