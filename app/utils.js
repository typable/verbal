import {state} from './main.js';

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
        return new Promise(async (resolve, reject) => {
            try {
                const headers = {
                    'content-type': 'application/json',
                }
                const deviceToken = localStorage.getItem('verbal-token');
                if(deviceToken) {
                    headers['verbal-token'] = deviceToken;
                }
                let body = null;
                let params = '';
                if(method === 'get' || method === 'head') {
                    params = '?' + new URLSearchParams(query).toString();
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
                    reject(`[${error.kind}] ${error.message}`);
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

export function $lang(id) {
    return state.locale[state.account?.language ?? 'en'][id];
}
