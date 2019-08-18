// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/

const apps = [];

const apolloTvServer = {
    name: 'ApolloTV Server',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '7G',
    env: {
        NODE_ENV: 'development'
    },
    merge_logs: true
};

if (process.env.DISABLE_PM2_LOGGING === 'true') {
    apolloTvServer.merge_logs = false;
    apolloTvServer.disable_logs = true;
    apolloTvServer.out_file = '/dev/null';
    apolloTvServer.error_file = '/dev/null';
}

apps.push(apolloTvServer);

if (process.env.RATE_LIMITER === 'true') {
    const rateLimiter = {
        name: 'Rate Limiter',
        script: './rate-limiter.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '200M',
        env: {
            NODE_ENV: 'development'
        },
        merge_logs: true
    };

    if (process.env.DISABLE_PM2_LOGGING === 'true') {
        rateLimiter.merge_logs = false;
        rateLimiter.disable_logs = true;
        rateLimiter.out_file = '/dev/null';
        rateLimiter.error_file = '/dev/null';
    }

    apps.push(rateLimiter);
}

module.exports = {
    apps
};
