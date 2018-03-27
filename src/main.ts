import * as express from 'express';
import * as nunjucks from 'nunjucks';
import {createStore} from 'redux';

interface IOrganisation {
	readonly guid: string;
	readonly name: string;
}

interface IState {
	readonly organisations: ReadonlyArray<IOrganisation>;
	readonly user: {
		readonly name: string;
	};
}

const initialState: IState = {
	user: {
		name: 'hello',
	},
	organisations: [],
};

enum ActionType {
	DEAUTHENTICATE = '[auth] deauthenticate',
	AUTHENTICATING = '[auth] authenticating',
	AUTHENTICATE = '[auth] authenticate',
	ADD_ORGANISATION = '[cf] add organisation',
	PUSH_NAVIGATION = '[router] push url',
}

const addOrganisation = (organisation: IOrganisation) => ({
	type: ActionType.ADD_ORGANISATION,
	payload: {organisation},
});

const pushNavigation = (name: string, params: {[key: string]: any}) => ({
	type: ActionType.PUSH_NAVIGATION,
	payload: {name, params},
});

type Action = ReturnType<typeof addOrganisation> | ReturnType<typeof pushNavigation>;

function render(state: IState): string {
	return nunjucks.renderString(`Hello {{ state.name }}`, state);
}

const reducer = (state = initialState, action: Action): IState => {
	switch (action.type) {
		case ActionType.PUSH_NAVIGATION:
			return state;
		case ActionType.ADD_ORGANISATION:
			return {
				...state,
				organisations: [
					...state.organisations,
				],
			};
		default:
			return state;
	}
};

async function _handler(_req: express.Request, _res: express.Response): Promise<string> {
	const store = createStore(reducer);
	const state = store.dispatch(pushNavigation('/organisations/org-1', {}));
	return render(state);
}

function handler(req: express.Request, res: express.Response): void {
	_handler(req, res)
		.then(output => res.send(output))
		.catch(err => {
			const trace = err.stack || err.toString();
			res.status(500).send(`<pre>${trace}</pre>`);
			console.error(err);
		});
}

export function init() {
	const app = express();

	app.get('/', handler);

	app.listen(5000);
}

init();
