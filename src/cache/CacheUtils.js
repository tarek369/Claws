module.exports.formatSave = (resultData, data) => {
    if (data.event === 'scrape') {
        return {
            uri: data.target,
            type: resultData.type,
            resultData,
            metadata: {
                eventType: 'scrape',
                provider: data.provider,
                resolver: data.resolver,
            }
        }
    } else {
        return {
            uri: data.file.data,
            type: resultData.type,
            resultData,
            metadata: {
                eventType: 'result',
                provider: data.metadata.provider,
                resolver: data.metadata.source,
                headers: data.metadata.headers,
            }
        }
    }
}