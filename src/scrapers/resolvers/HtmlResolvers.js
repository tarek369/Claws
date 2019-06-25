const createEvent = require('../../utils/createEvent');
const Utils = require('../../utils/index');

const HtmlResolver = class HtmlResolver {
    constructor(resolver, name) {
        this.resolverFunction = resolver;
    }

    async resolve(eventData, jar) {
        this.event = eventData;
        const html = Buffer.from(this.event.html, 'base64').toString();
        this.data = await this.resolverFunction(html, jar, this.event.headers);
        const videoLinks = this.getUrl();
        const qualityInfo = this.getQuality();

        return this.createWsEvent(videoLinks, qualityInfo);
    }

    createWsEvent(dataObjects, qualityObjects) {
        console.log(dataObjects)
        return dataObjects.map((data, index) => {
            let quality = '';
            if (dataObjects.length == qualityObjects.length) {
                quality = qualityObjects[index];
            }
            return createEvent(data, false, {}, { quality, provider: this.event.provider, source: this.event.resolver, cookie: this.event.cookie, isResultOfScrape: true })
        })
    }

}

const Openload = class Openload extends HtmlResolver {
    getUrl() {
        return [this.data.src];
    }

    getQuality() {
        return [this.data.res];
    }
}

const Streamango = class Streamango extends HtmlResolver {
    getUrl() {
        return [this.data.src];
    }

    getQuality() {
        return [this.data.res];
    }
}

const VShare = class VShare extends HtmlResolver {
    getUrl() {
        return [this.data];
    }

    getQuality() {
        return [];
    }
}

const GamoVideo = class GamoVideo extends HtmlResolver {
    getUrl() {
        return [this.data]
    }

    getQuality() {
        return [];
    }
}

const PowVideo = class PowVideo extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return !!dataObject.file ? dataObject.file : dataObject.link
        }))
    }

    getQuality() {
        return [];
    }
}

const Vidoza = class Vidoza extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.src;
        }))
    }

    getQuality() {
        return this.data.map((dataObject => {
            return Utils.qualityFromString(dataObject.res);
        }))
    }
}

const GoogleDrive = class GoogleDrive extends HtmlResolver {
    getUrl() {
        return this.data.map((dataObject => {
            return dataObject.link;
        }))
    }

    getQuality() {
        return [];
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
