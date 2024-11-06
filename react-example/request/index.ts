import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { LangBook, getLocale } from "../lang";
import { toast } from "../notifications";
import task from "../task";

export type Response<T> =
  | {
      data: T;
      success: true;
      errorCode?: string;
      errorMessage?: string;
    }
  | {
      data?: T;
      success: false;
      errorCode: number;
      errorMessage: string;
    };

type RequestConfig<
  D extends object,
  Q extends object,
  U extends string,
  P = PathVariables<U>,
> = Omit<AxiosRequestConfig<D>, "url" | "params"> & {
  /**
   * @example '/api/:id' => pathVariables: { id: "1" }
   * @example '/api/:id/:name' => pathVariables: { id: "1", name: "2" }
   */
  url: U;
  ignoreAuth?: boolean;
  silentError?: boolean;
  throwError?: boolean;
  params?: Q;
  /**
   * @example '/api/:id' => { id: "1" }
   * @example '/api/:id/:name' => { id: "1", name: "2" }
   */
  pathVariables?: P;
};

type ExtractKeys<T extends string> = T extends `${string}{${infer Key}}${infer Rest}`
  ? Key | ExtractKeys<Rest>
  : never;

type PathVariables<T extends string> =
  ExtractKeys<T> extends never
    ? Record<string, string | number>
    : Record<ExtractKeys<T>, string | number>;

export interface Request {
  <
    T,
    D extends object = any,
    Q extends object = any,
    U extends string = string,
    P = PathVariables<U>,
  >(
    args: RequestConfig<D, Q, U, P>,
  ): Promise<Response<T>>;
}

type Deps = {
  baseURL: string;
  headerAuthKey: string;
  headerAuthPrefix: string;
  headerLocaleKey: string;
  tokenGetter: () => Promise<string | undefined>;
  timeout: number;
};

const defaultDeps: Deps = {
  baseURL: "/",
  headerAuthKey: "Authorization",
  headerAuthPrefix: "Bearer",
  headerLocaleKey: "Locale",
  tokenGetter: async () => undefined,
  timeout: 5000,
};

let deps = defaultDeps;

export function init(_deps: Partial<Deps>) {
  deps = {
    ...defaultDeps,
    ..._deps,
  };
  axiosInstance = axios.create({
    baseURL: deps.baseURL,
    timeout: deps.timeout,
  });
}

let axiosInstance = axios.create({
  baseURL: deps.baseURL,
  timeout: deps.timeout,
});

const request: Request = async <
  T = any,
  D extends object = any,
  Q extends object = any,
  U extends string = string,
  P = PathVariables<U>,
>(
  args: RequestConfig<D, Q, U, P>,
) => {
  const { ignoreAuth, throwError, pathVariables, ...cfg } = args;
  let { silentError, headers, url } = args;

  headers = { ...headers, [deps.headerLocaleKey]: getLocale() };

  if (!ignoreAuth) {
    const token = await deps.tokenGetter();
    if (token) {
      headers = {
        ...headers,
        [deps.headerAuthKey]: `${deps.headerAuthPrefix} ${token}`,
      };
    }
  }

  if (pathVariables) {
    const v = pathVariables as any;
    const u = url.replace(/{(\w+)}/g, (match, key) => {
      const value = v[key];
      return value !== undefined ? value.toString() : match;
    });
    //@ts-ignore
    url = u;
  }

  const requestConfig = {
    ...cfg,
    headers,
    url,
  };
  try {
    const res = await axiosInstance.request<Response<T>>(requestConfig);
    return res.data;
  } catch (_error) {
    const error = _error as AxiosError<Response<T>, D>;
    let res: Response<T>;
    if (error.code === "ECONNABORTED") {
      res = {
        success: false,
        errorCode: 102,
        errorMessage: t("timeout"),
      };
    } else if (error.response) {
      if (error.response.data.success !== undefined) {
        res = error.response.data;
        switch (error.response.status) {
          case 401: {
            task.exec("logout");
            silentError = true;
            break;
          }
        }
      } else {
        res = {
          success: false,
          errorCode: 100,
          errorMessage: t("unknown"),
        };
      }
    } else {
      res = {
        success: false,
        errorCode: 101,
        errorMessage: t("network"),
      };
    }
    if (!silentError && res.errorMessage) {
      if (typeof window === "undefined") {
        const error = _error as AxiosError;
        console.info(`URL: ${error.config?.baseURL}${error.config?.url}\n${res.errorMessage}`);
      } else {
        toast?.(res.errorMessage, { level: "error" });
      }
    }
    if (throwError) {
      throw res;
    }
    return res;
  }
};

export default request;

//客戶端錯誤
const { t } = new LangBook({
  "en-US": {
    network: "Request failed, please check your network",
    unknown: "Unknown error.",
    timeout: "Request timed out.",
  },
  "zh-CN": {
    network: "请求失败，请检查网络",
    unknown: "未知错误",
    timeout: "请求超时",
  },
});
