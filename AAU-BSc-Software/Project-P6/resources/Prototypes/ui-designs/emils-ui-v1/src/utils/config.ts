import configData from '../../../config.json';

interface Config {
  'dev-direct-drone-connection': boolean;
  drone: {
    droneIP: string;
    skyControllerIP: string;
  };
  apiUrl: string;
}

const config = configData as Config;

export default config;
