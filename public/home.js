import Search from './search.js'

const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div>
            <a #search class="btn-large grey darken-3 waves-effect waves-light"><i class="material-icons right">search</i>Search TV shows and movies...</a>
        </div>
    </section>
`
function Home(state, context) {
    const root = view

    // Collect references to dynamic parts
    const {search} = view.collect(root)

    search.onclick = async () => {
        context.navigate(Search)
        // history.pushState({}, '', '/search')

        update()
    }

    const update = () => {
        console.log('Rendered Home')
    }
    update()

    return root
}

export default Home