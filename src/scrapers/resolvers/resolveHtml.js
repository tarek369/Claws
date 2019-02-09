const resolvers = {
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

async function resolveHtml(html, resolver, jar, headers) {
    const data = await resolvers[resolver](html, jar, headers);

    if (resolver === 'Openload') {
        return [await createEvent(data, false, {}, {quality: '', provider: 'Openload'})];

    } else if (resolver === 'Streamango') {
        return [await createEvent(data, false, {}, {quality: '', provider: 'Streamango'})];

    } else if (resolver === 'VShare') {
        return [await createEvent(data, false, {}, {quality: '', provider: 'VShare'})];

    } else if (resolver === 'PowVideo') {
        const dataList = [];
        for (const dataObject of data){
            dataList.push(await createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, {}, {quality: '', provider: 'PowVideo'}));
        }
        return dataList;

    } else if (resolver === 'GamoVideo') {
        const dataList = [];
        for (const dataObject of data){
            dataList.push(await createEvent(dataObject, false, {}, {quality: '', provider: 'GamoVideo'}));
        }
        return dataList;

    } else if (resolver === 'Vidoza') {
        const dataList = [];
        for (const dataObject of data) {
            dataList.push(await createEvent(dataObject.src, false, {}, {quality: dataObject.res, provider: 'Vidoza'}));
        }
        return dataList;

    } else if (resolver === 'GoogleDrive') {
        const dataList = [];
        for (const dataObject of data) {
            dataList.push(await createEvent(dataObject.link, false, {}, {quality: dataObject.quality, provider: 'GoogleDrive'}));
        }
        return dataList;

    } else {
        throw `Resolver ${resolver} not supported`;
    }
}

module.exports = exports = resolveHtml;