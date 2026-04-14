export type RequestContext = {
  requestId: string;
  accountId?: string;
  userId?: string;
};

export type ContextUser = {
  authUserId: string;
  userId: string;
  accountId: string;
  role: string;
  accessToken?: string;
};

export type ContextClient = {
  authUserId: string;
  clientId: string;
  accountId: string;
  email: string;
  name: string;
  accessToken?: string;
};

declare module "fastify" {
  interface FastifyRequest {
    contextUser?: ContextUser;
    contextClient?: ContextClient;
    requestContext: RequestContext;
  }
}
