import Player from './player.js'
import Search from './search.js'
import Home from './home.js'
import ManualPlay from './manualPlay.js'

const {h, reconcile} = stage0

const initialState = {
    results: [],
    lastResults: [],
    selectedTitle: {genre_ids: [], similarResults: []},
    lastSelectedTitle: {genre_ids: [], similarResults: []}
};

const routerView = h /* syntax: html */ `
    <section>
        <div class="mdl-layout mdl-js-layout mdl-layout--fixed-drawer mdl-layout--fixed-header">
            <header class="mdl-layout__header">
                <div class="mdl-layout__header-row">
                    <div class="mdl-layout-spacer"></div>
                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--expandable mdl-textfield--floating-label mdl-textfield--align-right">
                        <label class="mdl-button mdl-js-button mdl-button--icon" for="fixed-header-drawer-exp">
                            <i class="material-icons">search</i>
                        </label>
                        <div class="mdl-textfield__expandable-holder">
                            <input class="mdl-textfield__input" type="text" name="sample" id="fixed-header-drawer-exp">
                        </div>
                    </div>
                </div>
            </header>
            <div class="mdl-layout__drawer theme--dark">
                <span class="mdl-layout-title">ApolloTV</span>
                <nav class="mdl-navigation">
                    <a #home class="mdl-navigation__link" href="">Home</a>
                    <a #search class="mdl-navigation__link" href="">Search</a>
                    <a #player class="mdl-navigation__link" href="">Player</a>
                    <a #manualplay class="mdl-navigation__link" href="">Manual Play</a>
                </nav>
            </div>
            <main #page class="mdl-layout__content">
            </main>
        </div>
    </section>
`
function Router(state) {
    const root = routerView
    const refs = routerView.collect(root)

    let {page, player, search, home, manualplay} = refs

    state.infiniteScrollElement = page;

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

            // From MDL: https://getmdl.io/started/index.html#dynamic
                componentHandler.upgradeAllRegistered()
            }
        }

        update(Home)

        return root
    }

    const app = Router(initialState)
    document.body.appendChild(app)