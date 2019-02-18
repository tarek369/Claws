'use strict';

require('dotenv').config()
// process.env.PORT

const {execSync} = require('child_process')

const child = execSync(`GOOS=js GOARCH=wasm go build -o ./public/main.wasm -ldflags "-s -w -X main.SECRET_CLIENT_ID=${process.env.SECRET_CLIENT_ID} -X main.TMDB_API_KEY=${process.env.TMDB_API_KEY}" ./libs/main.go`)
console.log('error', child.error)
console.log('stdout ', child.stdout)
console.log('stderr ', child.stderr)