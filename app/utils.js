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
    return (body) => {
        return new Promise(async (resolve, reject) => {
            try {
                const headers = {
                    'content-type': 'application/json',
                }
                const deviceToken = localStorage.getItem('verbal.device_token');
                if(deviceToken) {
                    headers['verbal-device-token'] = deviceToken;
                }
                const response = await fetch(window.location.origin + path, {
                    method,
                    headers,
                    body: JSON.stringify(body)
                });
                resolve(await response.json());
            }
            catch(error) {
                reject(error);
            }
        });
    };
}

const locale = await http`get::/asset/json/locale.json`();

export function $lang(id) {
    return locale[state.locale ?? 'en'][id];
}
