// src/config/ApiConfig.js
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ENV } from './env';

// Computer IP address loaded from environment variable
const COMPUTER_IP = ENV.COMPUTER_IP;

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // Mobile - use computer IP for both Dev and Production (if testing locally)
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return `http://${COMPUTER_IP}:3000/api`;
  }

  // For web or other environments
  return 'http://localhost:3000/api';
};

// Get the model API URL (Python backend for skin disease detection)
export const getModelApiUrl = () => {
  return ENV.MODEL_API_URL;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  MODEL_API_URL: getModelApiUrl(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const getEndpointUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const logApiConfig = () => {
  console.log('API Configuration:', {
    BASE_URL: API_CONFIG.BASE_URL,
    MODEL_API_URL: API_CONFIG.MODEL_API_URL,
    TIMEOUT: API_CONFIG.TIMEOUT,
    ENV: __DEV__ ? 'development' : 'production',
    PLATFORM: Platform.OS,
    EXECUTION_ENV: Constants.executionEnvironment,
  });
};
