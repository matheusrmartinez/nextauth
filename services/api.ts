import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';

import { signOut } from '../context/AuthContext';
import { withSSRGuest } from '../utils/withSSRGuest';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPIClient(ctx = undefined){
let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies["reactauth.token"]}`,
    },
  });
  
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      if (error.response.status === 401) {
        if (error.response.data?.code === "token.expired") {
          cookies = parseCookies(ctx);
  
          const { "reactauth.refreshtoken": refreshToken } = cookies;
          // O error.config contém todas as informações da requisições (rota, parâmetros, cabeçalhos) para que a requisição possa ser disparada novamente.
          const originalConfig = error.config;
  
          if (!isRefreshing) {
            isRefreshing = true;
            api
              .post("/refresh", {
                refreshToken,
              })
              .then((response) => {
                const { token } = response.data;
  
                setCookie(ctx, "reactauth.token", token, {
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                  path: "/",
                });
                setCookie(
                  ctx,
                  "reactauth.refreshtoken",
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: "/",
                  }
                );
  
                api.defaults.headers["Authorization"] = `Bearer ${token}`;
  
                failedRequestsQueue.forEach((request) =>
                  request.onSuccess(token)
                );
                failedRequestsQueue = [];
              })
              .catch((error) => {
                failedRequestsQueue.forEach((request) =>
                  request.onFailure(error)
                );
                failedRequestsQueue = [];
  
                // se o processo estiver rodando no browser, realiza o signout.
                if (process.browser) {
                  signOut();
                }
              })
              .finally(() => {
                isRefreshing = false;
              });
  
            // Como não é possível utilizar um método async dentro dos interceptors do axios, é necessário retornar uma promisse conforme abaixo:
            return new Promise((resolve, reject) => {
              failedRequestsQueue.push({
                onSuccess: (token: string) => {
                  originalConfig.headers["Authorization"] = `Bearer ${token}`;
  
                  resolve(api(originalConfig));
                },
                onFailure: (error: AxiosError) => {
                  reject(error);
                },
              });
            });
          }
        } else {
          if (process.browser) {
            signOut();
          }
          else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }
      // Sempre que utilizar o interceptors é importante caso não ocorra nenhum erro esperado no contexto, repassar o erro para a chamada inicial que disparou o interceptor, para que o erro seja tratado por lá.
      return Promise.reject(error);
    }
  );  

  return api;
}



export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {},
  };
});
