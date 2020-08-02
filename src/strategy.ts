import { Request } from 'express'
import { Strategy } from 'passport-strategy'
import { AuthenticateOptions } from 'passport'

export type ApiKeyStrategyOptions = {
	header?: string
	prefix?: string
	passReqToCallback?: boolean
	name?: string
}
export type DoneFunction = (error: Error, user?: Object, info?: Object) => void
export type VerifyCallback = (apiKey: string, done: DoneFunction) => void
export type VerifyCallbackWithRequest = (req: Request, apiKey: string, done: DoneFunction) => void;
export type Verify = VerifyCallback | VerifyCallbackWithRequest

export class ApiKeyStrategy extends Strategy {

	public readonly name: string
	public readonly verify: Verify
	public readonly userProperty: string
	private readonly options: ApiKeyStrategyOptions

	constructor(options: ApiKeyStrategyOptions, verify: Verify) {
		super()
		this.options = {
			header: (options.header || 'X-Api-Key').toLowerCase(),
			prefix: options.prefix || '',
			passReqToCallback: options.passReqToCallback || false,
		}
		this.verify = verify
		this.name = 'api-key'
	}

	public authenticate(req: Request): void {
		let apiKey: string | null = req.header(this.options.header)

		if (!apiKey) {
			return this.fail(`Header '${this.options.header}' not found in request.`, 400)
		}

		const prefixRegExp = new RegExp(`^${this.options.prefix}`, 'i')

		if (prefixRegExp.test(apiKey)) {
			apiKey = apiKey.replace(prefixRegExp, '').trim()
		} else {
			return this.fail(new Error(`Invalid ApiKey prefix. Header '${this.options.header}' must start with '${this.options.prefix}' prefix.`), 400)
		}

		const verified = (error: Error | null, user?: Object, info?: Object): void => {
			if (error) {
				return this.error(error)
			}
			if (!user) {
				return this.fail('invalid_api_key', 401)
			}
			this.success(user, info)
		}

		const callbackParams = [req, apiKey, verified]

		if (!this.options.passReqToCallback) {
			callbackParams.shift()
		}

		// @ts-ignore
		this.verify(...callbackParams)
	}


}
