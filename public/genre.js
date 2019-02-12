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
    <div #chip class="chip deep-purple accent-3 waves-effect waves-light genre">
        #genre
    </div>
`
function Genre(genreId, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {chip, genre} = view.collect(root)

    chip.onclick = () => {
        console.log('NAVIGATE TO GENRE SEARCH')
    }

    genre.nodeValue = MOVIE_GENRES[genreId]

    root.update = function(newGenreId) {
        console.log('Rendered Genre')

        genre.nodeValue = MOVIE_GENRES[newGenreId] || 'Unknown'
    }

    return root
}

export default Genre