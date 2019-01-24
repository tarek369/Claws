import SearchResult from './searchResult.js'

const {h, keyed} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div class="mdl-textfield mdl-js-textfield theme--dark">
            <input #title class="mdl-textfield__input" type="text" id="search">
            <label class="mdl-textfield__label" for="search">Search</label>
        </div>
        <div #list class="flex"></div>
    </section>
`
function Search(state, context) {
    const root = view

    // Collect references to dynamic parts
    const {title, list} = view.collect(root)

    title.onkeyup = () => {
        state.title = title.value
    }

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    title.onkeydown = async (e) => {
        if (e.which == 13 || e.keyCode == 13) {
            state.page = 1
            const response = await new Promise((resolve) => fetchSearchResults(resolve, title.value, state.page))
            state.results = response.results
            update()
        }
    }

    let lastResults = []

    const update = () => {
        console.log('Rendered Search')

        // Stupid hack for focus to work
        setTimeout(() => title.focus(), 0)

        if (state.results) {
            keyed(
                'id',
                list,
                lastResults,
                state.results,
                result => SearchResult(result, context),
                (Component, result) => Component.update()
            )

            lastResults = state.results.slice()
        }
    }
    update()

    return root
}

export default Search