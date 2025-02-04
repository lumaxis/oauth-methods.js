import { RequestInterface, RequestOptions } from "@octokit/types";
import { RequestError } from "@octokit/request-error";

export function requestToOAuthBaseUrl(request: RequestInterface): string {
  const endpointDefaults = request.endpoint.DEFAULTS;
  return /^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl)
    ? "https://github.com"
    : endpointDefaults.baseUrl.replace("/api/v3", "");
}

export async function oauthRequest(
  request: RequestInterface,
  route: string,
  parameters: Record<string, unknown>
) {
  const withOAuthParameters = {
    baseUrl: requestToOAuthBaseUrl(request),
    headers: {
      accept: "application/json",
    },
    ...parameters,
  };
  const response = await request(route, withOAuthParameters);

  if ("error" in response.data) {
    const error = new RequestError(
      `${response.data.error_description} (${response.data.error}, ${response.data.error_url})`,
      400,
      {
        request: request.endpoint.merge(
          route,
          withOAuthParameters
        ) as RequestOptions,
        headers: response.headers,
      }
    );

    // @ts-ignore add custom response property until https://github.com/octokit/request-error.js/issues/169 is resolved
    error.response = response;

    throw error;
  }

  return response;
}
