interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}

export const geocodingService = {
  search: async (query: string): Promise<GeocodingResult | null> => {
    try {

      const coordsRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      
      if (coordsRegex.test(query)) {

        const [lat, lng] = query.split(',').map(coord => parseFloat(coord.trim()));
        return {
          lat,
          lng,
          display_name: `${lat}, ${lng}`
        };
      } else {

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'P6-Scan/1.0'
            }
          }
        );
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            display_name: data[0].display_name
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in geocoding search:', error);
      return null;
    }
  }
};
