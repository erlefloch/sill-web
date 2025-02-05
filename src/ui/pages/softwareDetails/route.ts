import { createGroup, defineRoute, createRouter, param, type Route } from "type-route";

export const routeDefs = {
    "softwareDetails": defineRoute(
        {
            "name": param.query.string,
            "autoOpenRemoveRoleModal": param.query.optional.boolean.default(false)
        },
        () => `/detail`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => false;
