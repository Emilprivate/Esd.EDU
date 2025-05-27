import axios from 'axios';

const API_URL = 'http://localhost:5000/drone/media';

export const mediaService = {
    getMediaInfo: async (mediaId = null) => {
        const params = mediaId ? { media_id: mediaId } : {};
        const response = await axios.get(`${API_URL}/media-info`, { params });
        return response.data;
    },

    getResourceInfo: async (mediaId = null, resourceId = null) => {
        const params = {
            ...(mediaId && { media_id: mediaId }),
            ...(resourceId && { resource_id: resourceId })
        };
        const response = await axios.get(`${API_URL}/resource-info`, { params });
        return response.data;
    }
};
