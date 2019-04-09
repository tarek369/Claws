const createEvent = require('../../utils/createEvent');


const HtmlResolver = class HtmlResolver {
    constructor(resolver, name) {
        this.resolverFunction = resolver;
    }

    async resolve(eventData, jar) {
        this.event = eventData;
        const html = Buffer.from(this.event.html, 'base64').toString();
        this.data = await this.resolverFunction(html, jar, this.event.headers);
        const videoLinks = this.getUrl();

        return this.createWsEvent(videoLinks);
    }

    createWsEvent(dataObjects) {
        console.log(dataObjects)
        return dataObjects.map((data) => {
            return createEvent(data, false, {}, { provider: this.event.provider, source: this.event.resolver, cookie: this.event.cookie, isResultOfScrape: true })
        })
    }

}

const Openload = class OpenLoad extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const Streamango = class Streamango extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const VShare = class VShare extends HtmlResolver {
    getUrl() {
        return [this.data];
    }
}

const GamoVideo = class GamoVideo extends HtmlResolver {
    getUrl() {
        return [this.data]
    }
}

const PowVideo = class PowVideo extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return !!dataObject.file ? dataObject.file : dataObject.link
        }))
    }
}

const Vidoza = class Vidoza extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.src;
        }))
    }
}

const GoogleDrive = class GoogleDrive extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.link;
        }))
    }
}

module.exports = {
    Openload,
    Streamango,
    VShare,
    GamoVideo,
    PowVideo,
    Vidoza,
    GoogleDrive
};
