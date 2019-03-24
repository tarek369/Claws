const randomUseragent = require('random-useragent');

/**
 * Fetch the useragent.
 * @return string
 */
function getUserAgent() {
    const excludeGroups = /Spider|Legacy|Console|Miscellaneous|Blackberry|HP|Barnes and Noble|Kyocera|Nec|Nokia|Palm|SonyEricson|Symbian|Services|WAP Phone/;

    return process.env['CLAWS_DEFAULT_UA'] || randomUseragent.getRandom((ua) => {
        // don't include questionable user-agents.
        return !excludeGroups.test(ua.folder);
    });
}

module.exports = {
    getUserAgent
};