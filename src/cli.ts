#!/usr/bin/env node

import meow from 'meow'
import { hash } from './hash'

const cli = meow(`
	Usage
	  $ hash-workspace <input>

	Examples
	  $ hash-workspace .
`)

async function run() {
	for (const input of cli.input) {
		const result = await hash({ path: input })
		console.log(result)
	}
}

run().catch(err => {
	console.error(err.message)
	process.exit(1)
})
