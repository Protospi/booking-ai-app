const config = {
  development: {
    apiBaseUrl: 'http://localhost:8000'
  },
  production: {
    apiBaseUrl: 'http://54.175.159.119:8000'
  }
};

const env = process.env.NEXT_PUBLIC_APP_ENV || 'development';

export const apiBaseUrl = config[env as keyof typeof config].apiBaseUrl; 