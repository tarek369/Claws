const rp = require('request-promise');
const HtmlResolvers = require('./HtmlResolvers');

const resolverFunctions = {
    Openload: require('./Openload').OpenloadHtml,
    Streamango: require('./Streamango').StreamangoHtml,
    // RapidVideo: require('./RapidVideo'),
    // AZMovies: require('./AZMovies'),
    // Vidlox: require('./Vidlox'),
    VShare: require('./VShare').VShareHtml,
    // SpeedVid: require('./SpeedVid'),
    // VidCloud: require('./VidCloud'),
    // ClipWatching: require('./ClipWatching'),
    // EStream: require('./EStream'),
    // Vidzi: require('./Vidzi'),
    // VidTodo: require('./VidTodo'),
    PowVideo: require('./PowVideo').PowVideoHtml,
    GamoVideo: require('./GamoVideo').GamoVideoHtml,
    // GorillaVid: require('./GorillaVid'),
    // DaClips: require('./DaClips'),
    // MovPod: require('./MovPod'),
    Vidoza: require('./Vidoza').VidozaHtml,
    // StreamM4u: require('./StreamM4u'),
    GoogleDrive: require('./GoogleDrive').GoogleDriveHtml
};

const createEvent = require('../../utils/createEvent');

async function resolveHtml(data) {
    const resolver = data.resolver;
    const jar = rp.jar();
    if (HtmlResolvers[resolver]) {
        const resolverFunction = resolverFunctions[resolver];
        const htmlResolver = new HtmlResolvers[resolver](resolverFunction);
        return htmlResolver.resolve(data, jar);
    } else {
        throw `Resolver ${resolver} not supported`;
    }
}

module.exports = exports = resolveHtml;