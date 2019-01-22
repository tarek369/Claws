const {h} = stage0
let es;

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <div class="searchBox">
            <input id="movieTitle" type="text" placeholder="Enter a movie..." />
            <br><br><br>
            <button #searchmovies type="button" class="material-button-raised primary">Search</button>
            <button #stopsearch type="button" class="material-button-raised red">Stop</button>
        </div>
        <div>
            <input id="showTitle" type="text" placeholder="show" />
            <input id="season" type="text" placeholder="season" />
            <input id="episode" type="text" placeholder="episode" />

            <button #searchtv type="button">Search</button>
        </div>
    </section>
`
function Search(state) {
    const root = view

    // Collect references to dynamic parts
    const {searchmovies, searchtv, stopsearch} = view.collect(root)

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    searchmovies.onclick = async () => {
        const token = await new Promise((resolve) => authenticate(resolve))
        const movieTitle = document.getElementById('movieTitle').value
        stop() // Stop existing eventsource.

        es = new EventSource(`/api/v1/search/movies?title=${movieTitle}&token=${token}`)
        es.addEventListener('result', resultListener)
        es.addEventListener('scrape', scrapeListener)
        es.addEventListener('error', errorListener)
        es.addEventListener('done', doneListener)

        update()
    }

    // TODO: Go 1.12 will eliminate the need for this Promise callback. Check Go's latest version in Febuary 2019
    searchtv.onclick = async () => {
        const token = await new Promise((resolve) => authenticate(resolve))
        const showTitle = document.getElementById('showTitle').value
        const season = document.getElementById('season').value
        const episode = document.getElementById('episode').value

        stop() // Stop existing eventsource.
        es = new EventSource(`/api/v1/search/tv?title=${showTitle}&season=${season}&episode=${episode}&token=${token}`)
        es.addEventListener('result', resultListener)
        es.addEventListener('scrape', scrapeListener)
        es.addEventListener('error', errorListener)
        es.addEventListener('done', doneListener)

        update()
    }

    stopsearch.onclick = stop

    function resultListener(e) {
        let data = JSON.parse(e.data);
        console.log(data.event, data);
    }

    function scrapeListener(e) {
      console.log('scrape', JSON.parse(e.data))
    }

    function errorListener(e) {
      console.error('error', JSON.parse(e.data))
    }

    function doneListener(e) {
      console.log('done', JSON.parse(e.data))
      console.log('There should be no more events after this one. Comment out the `close` line to see if there are any events leaking.')
      es.close()
    }

    function stop() {
        es && es.close()
    }

    const update = () => {}
    update()

    return root
}

export default Search