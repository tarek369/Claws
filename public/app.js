import Player from './player.js'
import Search from './search.js'
import Home from './home.js'
import ManualPlay from './manualPlay.js'

const {h, reconcile} = stage0

const initialState = {};

const routerView = h /* syntax: html */ `
    <section>
        <ul>
            <li><a href="" #home>Home</a></li>
            <li><a href="" #search>Search</a></li>
            <li><a href="" #player>Player</a></li>
            <li><a href="" #manualplay>Manual Play</a></li>
        </ul>
        <section #page></section>
    </section>
`
function Router(state) {
    const root = routerView
    const refs = routerView.collect(root)

    let {page, player, search, home, manualplay} = refs

    const context = {navigate: update}

    home.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/')
        update(Home)
    }

    search.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/search')
        update(Search)
    }

    manualplay.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/manualplay')
        update(ManualPlay)
    }

    player.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/player')
        update(Player)
    }

    let lastComponent;

    function update(Component) {
        console.log('Rendered Router')
        if (Component) {
            if (!lastComponent) {
                page.appendChild(Component(state, context, 'attach'))
            } else {
                console.log(lastComponent, Component)
                page.replaceChild(Component(state, context, 'attach'), lastComponent(state, context, 'remove'))
            }
            lastComponent = Component

            // From MDL: https://getmdl.io/started/index.html#dynamic
            componentHandler.upgradeAllRegistered()
        }
    }

    update(Home)

    return root
}

const app = Router(initialState)
document.body.appendChild(app)