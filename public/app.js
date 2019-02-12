import Player from './player.js'
import Search from './search.js'
import Home from './home.js'
import ManualPlay from './manualPlay.js'

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
                    <ul class="right">
                        <li><a class="btn-floating btn-small btn-flat waves-effect transparent"><i class="material-icons">#pageaction</i></a></li>
                    </ul>
                </div>
            </nav>
        </div>

        <ul #sidenav id="slide-out" class="sidenav sidenav-fixed">
            <li><a #home class="mdl-navigation__link" href="">Home</a></li>
            <li><a #search class="mdl-navigation__link" href="">Search</a></li>
            <li><a #player class="mdl-navigation__link" href="">Player</a></li>
            <li><a #manualplay class="mdl-navigation__link" href="">Manual Play</a></li>
        </ul>

        <main #page class="mdl-layout__content"></main>
    </section>
`
function Router(state) {
    const root = routerView
    const refs = routerView.collect(root)

    let {page, player, search, home, manualplay, pageaction, sidenav} = refs

    state.infiniteScrollElement = page;

    const context = {navigate: update}

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

        pageaction.nodeValue = state.pageAction

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

        update(Home)

        return root
    }

    const app = Router(initialState)
    document.body.appendChild(app)