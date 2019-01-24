import Search from './search.js'

const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div>
            <button #search class="mdl-button theme--dark mdl-js-button mdl-button--raised mdl-js-ripple-effect">Search TV shows and movies... <i class="material-icons">search</i></button>
        </div>
    </section>
`
function Home(state, context) {
    const root = view

    // Collect references to dynamic parts
    const {search} = view.collect(root)

    search.onclick = async () => {
        context.navigate(Search)

        update()
    }


    const update = () => {
        console.log('Rendered Home')
    }
    update()

    return root
}

export default Home