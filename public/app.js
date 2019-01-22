import Player from './player.js'
import Search from './search.js'

const {h, reconcile} = stage0

const initialState = {
    todos: []
};

const routerView = h /* syntax: html */ `
    <section>
        <ul>
            <li><a href="" #search>Search</a></li>
            <li><a href="" #player>Player</a></li>
        </ul>
        <section #page></section>
    </section>
`
function Router(state) {
    const root = routerView
    const refs = routerView.collect(root)

    let {page, player, search} = refs


    search.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/')
        update(Search)
    }

    player.onclick = (e) => {
        e.preventDefault();
        // history.pushState({}, '', '/player')
        update(Player)
    }

    let lastComponent;

    function update(Component) {
        if (Component) {
            if (!lastComponent) {
                page.appendChild(Component(state))
            } else {
                page.replaceChild(Component(state), lastComponent(state))
            }
            lastComponent = Component
        }
    }

    update(Search)

    return root
}

const app = Router(initialState)
document.body.appendChild(app)