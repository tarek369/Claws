const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const MOVIE_GENRES = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
};

const view = h /* syntax: html */ `
    <button #chip type="button" class="mdl-chip mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--primary genre">
        <span class="mdl-chip__text capitalize">#genre</span>
    </button>
`
function Genre(genreObject, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {chip, genre} = view.collect(root)

    chip.onclick = () => {
        console.log('NAVIGATE TO GENRE SEARCH')
        // state.selectedTitle = result
        // // history.pushState({}, '', `/${result.id}`)
        // if (result.media_type === 'tv') {
        //     context.navigate(TvTitlePage)
        // } else {
        //     context.navigate(MovieTitlePage)
        // }
    }

    console.log(genreObject)
    genre.nodeValue = MOVIE_GENRES[genreObject.id]

    root.update = function(newGenreObject) {
        console.log('Rendered Genre')

        genre.nodeValue = MOVIE_GENRES[newGenreObject.id]
    }

    return root
}

export default Genre