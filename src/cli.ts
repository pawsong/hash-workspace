#!/usr/bin/env node

import meow from 'meow'
import { hash } from './hash'

const cli = meow(`
	Usage
		$ hash-workspace <input>


	Options
		--verbose, -v  Verbose output

	Examples
	  $ hash-workspace .
`, {
	flags: {
		verbose: {
			type: 'boolean',
			alias: 'v'
		}
	}
})

async function run() {
	for (const input of cli.input) {
		const result = await hash({
			path: input,
			verbose: cli.flags.verbose,
		})
		console.log(result)
	}
}

run().catch(err => {
	console.error(err.message)
	process.exit(1)
})
