const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <section>
        <h1>Player</h1>
        <div>
            <input #link/>
            <button #play>Play</button>
        </div>
        <div>
            <video #video controls autoplay style="width: 500px;"></video>
        </div>
    </section>
`
function Player(state) {
    const root = view

    // Collect references to dynamic parts
    const {play, link, video} = view.collect(root)

    play.onclick = async () => {
        update()
    }

    const update = () => {
        if (link.value) {
            video.src = link.value
            video.type = 'video/*'
        }
    }
    update()

    return root
}

export default Player