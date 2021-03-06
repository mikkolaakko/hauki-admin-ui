import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as querystring from 'querystring';
import { ParsedUrlQueryInput } from 'querystring';
import {
  DatePeriod,
  DatePeriodOptions,
  LanguageStrings,
  Resource,
  ResourceState,
  TimeSpanGroup,
} from '../../lib/types';
import { AuthTokens, getTokens } from '../../../auth/auth-context';

const apiBaseUrl: string = window.ENV?.API_URL || 'http://localhost:8000';

const resourceBasePath = '/resource';
const datePeriodBasePath = '/date_period';
const authRequiredTest = '/auth_required_test';
const invalidateAuthPath = '/invalidate_signature';

interface RequestParameters {
  [key: string]:
    | string
    | number
    | boolean
    | ReadonlyArray<string>
    | ReadonlyArray<number>
    | ReadonlyArray<boolean>
    | undefined
    | LanguageStrings
    | TimeSpanGroup[]
    | ResourceState
    | null;
}

interface GetParameters {
  path: string;
  headers?: { [key: string]: string };
  parameters?: RequestParameters;
}

interface DataRequestParameters {
  path: string;
  headers?: { [key: string]: string };
  data?: RequestParameters;
}

interface OptionsParameters {
  path: string;
}

interface PostParameters extends DataRequestParameters {
  useRootPath?: boolean;
}

type PutRequestParameters = DataRequestParameters;

enum ApiResponseFormat {
  json = 'json',
}

interface ApiParameters extends RequestParameters {
  format: ApiResponseFormat;
}

const addTokensToRequestConfig = (
  authTokens: AuthTokens,
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `haukisigned ${querystring.stringify(
        (authTokens as unknown) as ParsedUrlQueryInput
      )}`,
    },
  };
};

async function request<T>(requestConfig: AxiosRequestConfig): Promise<T> {
  const authTokens: AuthTokens | undefined = getTokens();
  const config: AxiosRequestConfig = authTokens
    ? addTokensToRequestConfig(authTokens, requestConfig)
    : requestConfig;

  const response: AxiosResponse<T> = await axios.request<T, AxiosResponse<T>>(
    config
  );
  return response.data;
}

async function apiGet<T>({ path, parameters = {} }: GetParameters): Promise<T> {
  const apiParameters: ApiParameters = {
    ...parameters,
    format: ApiResponseFormat.json,
  };

  return request<T>({
    url: `${apiBaseUrl}/v1${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'get',
    params: apiParameters,
  });
}

const validateStatus = (status: number): boolean => status < 300;

async function apiPost<T>({
  path,
  data = {},
  useRootPath = false,
}: PostParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}${useRootPath ? '' : '/v1'}${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'post',
    data,
    validateStatus,
  });
}

async function apiPut<T>({
  path,
  data = {},
}: PutRequestParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/v1${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'put',
    data,
    validateStatus,
  });
}

async function apiOptions<T>({ path }: OptionsParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/v1${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'options',
    validateStatus(status) {
      return status < 300;
    },
  });
}

async function apiDelete<T>({ path }: GetParameters): Promise<T> {
  return request<T>({
    url: `${apiBaseUrl}/v1${path}/`,
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'delete',
  });
}

interface AuthTestResponse {
  message: string;
  username: string;
}

export interface InvalidateAuthResponse {
  success: boolean;
}

export interface PermissionResponse {
  has_permission: boolean;
}

export default {
  invalidateAuth: async (): Promise<boolean> => {
    const successResponse = await apiPost<InvalidateAuthResponse>({
      path: invalidateAuthPath,
      useRootPath: true,
    });

    return successResponse.success;
  },

  getResource: (id: string): Promise<Resource> =>
    apiGet<Resource>({ path: `${resourceBasePath}/${id}` }),

  getDatePeriods: (resourceId: number): Promise<DatePeriod[]> =>
    apiGet<DatePeriod[]>({
      path: `${datePeriodBasePath}`,
      parameters: { resource: resourceId, end_date_gte: '-1d' },
    }),

  getDatePeriod: (datePeriodId: number): Promise<DatePeriod> =>
    apiGet<DatePeriod>({
      path: `${datePeriodBasePath}/${datePeriodId}`,
    }),

  getDatePeriodFormOptions: (): Promise<DatePeriodOptions> =>
    apiOptions<DatePeriodOptions>({
      path: `${datePeriodBasePath}`,
    }),

  postDatePeriod: (datePeriod: DatePeriod): Promise<DatePeriod> =>
    apiPost<DatePeriod>({
      path: `${datePeriodBasePath}`,
      data: datePeriod,
    }),

  putDatePeriod: (datePeriod: DatePeriod): Promise<DatePeriod> =>
    apiPut<DatePeriod>({
      path: `${datePeriodBasePath}/${datePeriod.id}`,
      data: datePeriod,
    }),

  deleteDatePeriod: (id: number): Promise<{ success: boolean }> =>
    apiDelete<{ success: boolean }>({
      path: `${datePeriodBasePath}/${id}`,
    }),

  testAuth: (): Promise<AuthTestResponse> =>
    apiGet<AuthTestResponse>({
      path: authRequiredTest,
    }),

  testResourcePostPermission: async (resourceId: string): Promise<boolean> => {
    const permission = await apiPost<PermissionResponse>({
      path: `${resourceBasePath}/${resourceId}/permission_check`,
    });
    return permission.has_permission;
  },
};
