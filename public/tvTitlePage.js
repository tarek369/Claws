const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const TV_GENRES = {
    10759:  "Action & Adventure",
    16:  "Animation",
    35:  "Comedy",
    80:  "Crime",
    99:  "Documentary",
    18:  "Drama",
    10751:  "Family",
    10762:  "Kids",
    9648:  "Mystery",
    10763:  "News",
    10764:  "Reality",
    10765:  "Sci-Fi & Fantasy",
    10766:  "Soap",
    10767:  "Talk",
    10768:  "War & Politics",
    37:  "Western",
}

const view = h /* syntax: html */ `
    <pre>
        #info
    </pre>
`
function TvTitlePage(state, context) {
    const root = view

    // Collect references to dynamic parts
    const {info} = view.collect(root)

    info.nodeValue = JSON.stringify(state.selectedTitle, null, 4)

    const update = () => {
        console.log('Rendered TvTitlePage')
    }
    update()

    return root
}

export default TvTitlePage