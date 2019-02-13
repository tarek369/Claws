const {h} = stage0

// Create view template.
// Mark dynamic references with a #-syntax where needed.

const view = h /* syntax: html */ `
    <li #actioncontainer>
        <a #actionbutton class="btn-floating btn-small btn-flat waves-effect transparent"><i class="material-icons">#actionicon</i></a>
    </li>
`
function Action(action, context) {
    const root = view.cloneNode(true)

    // Collect references to dynamic parts
    const {actioncontainer, actionbutton, actionicon} = view.collect(root)

    actionbutton.onclick = action.onclick
    actionicon.nodeValue = action.icon
    if (action.onlyOnMobile) {
        actioncontainer.classList.add('only-on-mobile')
    }
    if (action.className) {
        actioncontainer.classList.add(action.className)
    }

    root.update = function(action) {
        console.log('Rendered Action')

        actionbutton.onclick = action.onclick
        actionicon.nodeValue = action.icon
        if (action.onlyOnMobile) {
            actioncontainer.classList.add('only-on-mobile')
        }
        if (action.className) {
            actioncontainer.classList.add(action.className)
        }
    }

    return root
}

export default Action