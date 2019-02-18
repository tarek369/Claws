import Genre from './genre.js'
import SearchResult from './searchResult.js'
import Player from './player.js'

const {h, keyed, reuseNodes} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <div class="movie-layout">
        <div class="movie-backdrop">
            <img #backdropimg class="movie-backdrop-img" />
            <div class="movie-backdrop-shade"></div>
            <img #poster class="movie-poster" width="250px" />
        </div>
        <div class="movie-metadata-container">
            <h2>#title</h2>
            <h4 class="movie-metadata"><i class="material-icons">star</i>#subheader</h4>
            <div #genrelist class="genres-container"></div>
            <p #descriptioncontainer><a #descriptiontrigger class="description">#description</a></p>
            <div class="flex center">
                <div class="resume-playing-container">
                    <a #playorresume class="btn-flat waves-effect waves-light white-text play-button">
                        <i class="material-icons left">play_arrow</i>
                        #playtext
                    </a>
                </div>
                <div #progress class="play-time progress deep-purple lighten-3">
                    <div class="determinate deep-purple accent-2" style="width: 70%"></div>
                </div>
            </div>
            <div #playfrombeginning>
                <a class="btn-flat waves-effect waves-light white-text play-button">
                    <i class="material-icons left">skip_previous</i>
                    Play from beginning
                </a>
            </div>
            <div>
                <a class="btn-flat waves-effect waves-light white-text play-button">
                    <i class="material-icons left">live_tv</i>
                    Play trailer
                </a>
            </div>
        </div>
        <div class="movie-similar-list-container">
            <div class="movie-similar-list-title-container">
                <h4>Similar Movies</h4>
                <a #favoritebutton class="btn-small waves-effect waves-light deep-purple accent-2 favorite-button"><i class="material-icons left">#favoriteicon</i>#favoritetext</a>
            </div>
            <div #similarlist class="movie-similar-list"></div>
        </div>
    </div>
`
function MovieTitlePage(state, context) {
    const root = view

    // Collect references to dynamic parts
    const {backdropimg, title, subheader, genrelist, description, descriptioncontainer, descriptiontrigger, poster, similarlist, favoritebutton, favoriteicon, favoritetext, playorresume, playtext, progress, playfrombeginning} = view.collect(root)

    const toggleFavorites = async () => {
        let favorite
        try {
            favorite = await getFavorite(state.selectedTitle.id)
        } catch (err) {
            console.error(err)
        }
        if (favorite) {
            try {
                await removeFavorite(state.selectedTitle.id)
            } catch (err) {
                console.error(err)
            }
        } else {
            try {
                await addFavorite({...state.selectedTitle, similarResults: []})
            } catch (err) {
                console.error(err)
            }
        }
        update()
    }

    favoritebutton.onclick = toggleFavorites

    descriptiontrigger.onclick = () => alert(state.selectedTitle.overview)

    playorresume.onclick = () => context.navigate(Player)

    async function update(action) {
        console.log('Rendered MovieTitlePage')

        // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
        if (action !== 'remove' && state.selectedTitle.id && !state.selectedTitle.similarResults.length) {
            console.log('Fetching similar titles!')
            const response = await new Promise((resolve) => fetchSimilarResults(resolve, state.selectedTitle.id, 1))
            state.selectedTitle.similarResults = response.results
        }

        if (action !== 'remove') {
            let favorite
            try {
                favorite = await getFavorite(state.selectedTitle.id)
            } catch (err) {
                console.error(err)
            }
            if (favorite) {
                favoriteicon.nodeValue = 'favorite'
                favoritetext.nodeValue = 'Remove from favorites'
                favoritebutton.classList.add('is-favorite')
                context.updateActions([{icon: 'favorite', onclick: toggleFavorites, onlyOnMobile: true, className: 'is-favorite'}])

            } else {
                favoriteicon.nodeValue = 'favorite_border'
                favoritetext.nodeValue = 'Add to favorites'
                favoritebutton.classList.remove('is-favorite')
                context.updateActions([{icon: 'favorite_border', onclick: toggleFavorites, onlyOnMobile: true}])
            }
        }

        playtext.nodeValue = 'Play'
        progress.style.display = 'none'
        playfrombeginning.style.display = 'none'
        title.nodeValue = state.selectedTitle.title || state.selectedTitle.name
        subheader.nodeValue = `${state.selectedTitle.vote_average || 0} (${state.selectedTitle.vote_count})${state.selectedTitle.release_date ? ` | ${(new Date(state.selectedTitle.release_date)).getFullYear()}` : ''}`
        description.nodeValue = state.selectedTitle.overview

        let height = 0
        const range = document.createRange()
        const parentNode = title.parentNode
        const parentHeight = 65
        parentNode.style['font-size'] = "50px"
        range.selectNodeContents(title)
        let rect = range.getBoundingClientRect()
        height = rect.height
        if (height > 0 && parentHeight > 0) {
            while (height > parentHeight - 10) {
                parentNode.style['font-size'] = parseFloat(parentNode.style['font-size'], 10) - 1 + "px"
                rect = range.getBoundingClientRect()
                height = rect.height
            }
        }

        if (descriptioncontainer.clientHeight > 63) {
            const words = description.nodeValue.split(/\s+/)
            words.push('...')

            do {
                words.splice(-2, 1)
                description.nodeValue = words.join(' ')
            } while(descriptioncontainer.clientHeight > 63)
        }
        poster.src = `https://image.tmdb.org/t/p/w300${state.selectedTitle.poster_path}`
        backdropimg.src = `https://image.tmdb.org/t/p/w500${state.selectedTitle.backdrop_path}`

        reuseNodes(
            genrelist,
            state.lastSelectedTitle.genre_ids,
            state.selectedTitle.genre_ids.slice(),
            genreId => Genre(genreId, context),
            (Component, genreId) => {
                return Component.update(genreId)
            }
        )

        let components = []

        keyed(
            'id',
            similarlist,
            state.lastSelectedTitle.similarResults.slice(),
            state.selectedTitle.similarResults.slice(),
            // This assumes similar results are of the same media type (movie, tv)
            result => {
                const Component = SearchResult(result, state, {navigate: update})
                components.push(Component)
                return Component
            },
            (Component, result) => {
                return Component.update()
            }
        )

        components.forEach(Component => setTimeout(() => Component.update(), 0))

        state.lastSelectedTitle = state.selectedTitle
    }
    update()

    root.cleanup = function() {
        state.selectedTitle = {...state.selectedTitle, genre_ids: [], similarResults: []}
        context.updateActions([])
        update('remove')
    }

    return root
}

export default MovieTitlePage