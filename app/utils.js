import {state, TOKEN_NAME} from './main.js';

const ltr = (parts, values) => {
	let string = '';
    for(let i = 0; i < parts.length; i++) {
    	string += parts[i];
        string += values[i] ?? '';
    }
    return string;
}

export function http(parts, ...values) {
    const line = ltr(parts, values).trim();
    const regex = /^(\w+)::([\w\/.]*)$/;
    const [, method, path] = line.match(regex) ?? [];
    return (query) => {
        if(query !== undefined) {
            query = JSON.parse(JSON.stringify(query));
        }
        return new Promise(async (resolve, reject) => {
            try {
                const headers = {
                    'content-type': 'application/json',
                }
                const token = localStorage.getItem(TOKEN_NAME);
                if(token) {
                    headers['verbal-token'] = token;
                }
                let body = null;
                let params = '';
                if(method === 'get' || method === 'head') {
                    if(query !== undefined && query !== null) {
                        for(const [key, value] of Object.entries(query)) {
                            if(Array.isArray(value)) {
                                delete query[key];
                                for(let i = 0; i < value.length; i++) {
                                    query[`${key}[${i}]`] = value[i];
                                }
                            }
                            else if(value === null) {
                                delete query[key];
                            }
                        }
                    }
                    params = '?' + new URLSearchParams(query).toString();
                    params = params.replaceAll(/%5B/g, '[');
                    params = params.replaceAll(/%5D/g, ']');
                }
                else {
                    body = JSON.stringify(query);
                }
                const response = await fetch(window.location.origin + path + params, {
                    method,
                    headers,
                    body
                });
                const json = await response.json();
                const {ok, data, error} = json;
                if(ok === undefined) {
                    resolve(json);
                    return;
                }
                if(!ok) {
                    reject(error.message);
                    return;
                }
                resolve(data);
            }
            catch(error) {
                reject(error);
            }
        });
    };
}

export async function update() {

}

export function $lang(id, ...args) {
    let message = state.locale[state.account?.language ?? 'en'][id];
    for(const i in args) {
        message = message.replaceAll(`{${i}}`, args[i]);
    }
    return message;
}
