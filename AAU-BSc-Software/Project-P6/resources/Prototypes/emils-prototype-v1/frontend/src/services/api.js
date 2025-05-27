import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

export const api = axios.create({
    baseURL: API_BASE_URL
});

export const endpoints = {
    tests: {
        list: '/tests/list',
        run: '/tests/run'
    },
    media: {
        info: '/drone/media/media-info',
        resource: '/drone/media/resource-info'
    }
};
