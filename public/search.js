import SearchResult from './searchResult.js'
import infiniteScroll from './infiniteScroll.js'

const {h, keyed} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div class="mdl-textfield mdl-js-textfield theme--dark">
            <input #title class="mdl-textfield__input" type="text" id="search">
            <label class="mdl-textfield__label" for="search">Search</label>
        </div>
        <div #list class="flex wrap"></div>
    </section>
`
function Search(state, context, action) {
    const root = view

    // Collect references to dynamic parts
    const {title, list} = view.collect(root)

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    const infiniteScrollOptions = {
        action,
        distance: 245,
        callback: async function(done) {
            // 1. fetch data from the server
            // 2. insert it into the document
            // 3. call done when we are done
            if (state.pageNumber < state.totalPages) {
                const response = await new Promise((resolve) => fetchSearchResults(resolve, title.value, state.pageNumber + 1))
                state.results = state.results.concat(response.results)
                state.pageNumber = response.page
                state.totalPages = response.total_pages
                update()
            }
            done()
        }
    }

    title.oninput = () => {
        state.title = title.value
    }

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    title.onkeydown = async (e) => {
        if (e.which == 13 || e.keyCode == 13) {
            const response = await new Promise((resolve) => fetchSearchResults(resolve, title.value, 1))
            state.results = response.results
            state.pageNumber = response.page
            state.totalPages = response.total_pages
            // setup infinite scroll
            infiniteScroll(infiniteScrollOptions);
            update()
        }
    }

    if (!state.lastResults) {
        state.lastResults = []
    }

    function update() {
        console.log('Rendered Search', action)

        // Stupid hack for focus to work
        setTimeout(() => title.focus(), 0)

        keyed(
            'id',
            list,
            state.lastResults,
            (state.results || []).slice(),
            result => SearchResult(result, state, context),
            (Component, result) => Component.update()
        )

        state.lastResults = (state.results || []).slice()
    }
    update()

    return root
}

export default Search