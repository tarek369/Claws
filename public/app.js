import Player from './player.js'
import Search from './search.js'
import Home from './home.js'
import ManualPlay from './manualPlay.js'
import Action from './action.js'

const {h, reconcile} = stage0

const initialState = {
    pageAction: 'favorite',
    results: [],
    lastResults: [],
    selectedTitle: {genre_ids: [], similarResults: []},
    lastSelectedTitle: {genre_ids: [], similarResults: []}
};

const routerView = h /* syntax: html */ `
    <section>
        <div class="navbar-fixed">
            <nav class="deep-purple accent-3">
                <div class="nav-wrapper">
                    <span href="#" class="brand-logo left"><a href="#" data-target="slide-out" class="sidenav-trigger"><i class="material-icons">menu</i></a></span>
                    <ul #pageactions class="right"></ul>
                </div>
            </nav>
        </div>

        <ul #sidenav id="slide-out" class="sidenav sidenav-fixed">
            <li><a #home href="">Home</a></li>
            <li><a #search href="">Search</a></li>
            <li><a #player href="">Player</a></li>
            <li><a #manualplay href="">Manual Play</a></li>
        </ul>

        <main #page></main>
    </section>
`
function Router(state) {
    const root = routerView
    const refs = routerView.collect(root)

    let {page, player, search, home, manualplay, sidenav, pageactions} = refs

    const context = {navigate: update, updateActions}

    M.Sidenav.init(sidenav)

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

    let lastNode;

    function update(Component) {
        console.log('Rendered Router')

        if (Component) {
            let currentNode = Component(state, context, 'attach')
            if (!lastNode) {
                page.appendChild(currentNode)
            } else {
                lastNode.cleanup && lastNode.cleanup()
                page.replaceChild(currentNode, lastNode)
            }
            lastNode = currentNode
        }
    }

    let lastActions = [];

    function updateActions(actions) {
        reconcile(
            pageactions,
            lastActions,
            actions.slice(),
            action => Action(action),
            (Component, action) => {
                return Component.update(action)
            }
        )
        lastActions = actions
    }

    update(Home)

    return root
}

const app = Router(initialState)
document.body.appendChild(app)