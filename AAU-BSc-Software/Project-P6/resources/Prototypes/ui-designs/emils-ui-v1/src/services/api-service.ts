import config from '../utils/config';

export interface Test {
  path: string;
  name: string;
  category: string;
  description: string;
}

export interface TestResult {
  success: boolean;
  result: any;
}

const apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl : `${config.apiUrl}/`;

export const droneApi = {
  takeoff: async (): Promise<{success: boolean; message: string}> => {
    try {
      const response = await fetch(`${apiUrl}drone/takeoff`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error taking off:', error);
      return { success: false, message: 'Network error during takeoff' };
    }
  },

  land: async (): Promise<{success: boolean; message: string}> => {
    try {
      const response = await fetch(`${apiUrl}drone/land`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error landing:', error);
      return { success: false, message: 'Network error during landing' };
    }
  }
};

export const testApi = {
  getTests: async (): Promise<Test[]> => {
    try {
      const response = await fetch(`${apiUrl}tests/list`);
      const data = await response.json();
      return data.tests || [];
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    }
  },

  runTest: async (testPath: string): Promise<TestResult> => {
    try {
      const response = await fetch(`${apiUrl}tests/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test_path: testPath }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error running test:', error);
      return {
        success: false,
        result: { error: 'Network error during test execution' }
      };
    }
  }
};
