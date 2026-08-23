/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AppRouteImport } from './routes/app'
import { Route as LoginRouteImport } from './routes/login'
import { Route as CompteRouteImport } from './routes/compte'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as MentionsLegalesRouteImport } from './routes/mentions-legales'
import { Route as ConfidentialiteRouteImport } from './routes/confidentialite'
import { Route as CguRouteImport } from './routes/cgu'
import { Route as EditorIdRouteImport } from './routes/editor.$id'
import { Route as RapportIdRouteImport } from './routes/rapport.$id'
import { Route as EntrepriseOrgIdRouteImport } from './routes/entreprise.$orgId'
import { Route as ApiAuthSplatRouteImport } from './routes/api/auth/$'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AppRoute = AppRouteImport.update({ id: '/app', path: '/app', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const CompteRoute = CompteRouteImport.update({ id: '/compte', path: '/compte', getParentRoute: () => rootRouteImport } as any)
const AdminRoute = AdminRouteImport.update({ id: '/admin', path: '/admin', getParentRoute: () => rootRouteImport } as any)
const MentionsLegalesRoute = MentionsLegalesRouteImport.update({ id: '/mentions-legales', path: '/mentions-legales', getParentRoute: () => rootRouteImport } as any)
const ConfidentialiteRoute = ConfidentialiteRouteImport.update({ id: '/confidentialite', path: '/confidentialite', getParentRoute: () => rootRouteImport } as any)
const CguRoute = CguRouteImport.update({ id: '/cgu', path: '/cgu', getParentRoute: () => rootRouteImport } as any)
const EditorIdRoute = EditorIdRouteImport.update({ id: '/editor/$id', path: '/editor/$id', getParentRoute: () => rootRouteImport } as any)
const RapportIdRoute = RapportIdRouteImport.update({ id: '/rapport/$id', path: '/rapport/$id', getParentRoute: () => rootRouteImport } as any)
const EntrepriseOrgIdRoute = EntrepriseOrgIdRouteImport.update({ id: '/entreprise/$orgId', path: '/entreprise/$orgId', getParentRoute: () => rootRouteImport } as any)
const ApiAuthSplatRoute = ApiAuthSplatRouteImport.update({ id: '/api/auth/$', path: '/api/auth/$', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/login': typeof LoginRoute
  '/compte': typeof CompteRoute
  '/admin': typeof AdminRoute
  '/mentions-legales': typeof MentionsLegalesRoute
  '/confidentialite': typeof ConfidentialiteRoute
  '/cgu': typeof CguRoute
  '/editor/$id': typeof EditorIdRoute
  '/rapport/$id': typeof RapportIdRoute
  '/entreprise/$orgId': typeof EntrepriseOrgIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/login': typeof LoginRoute
  '/compte': typeof CompteRoute
  '/admin': typeof AdminRoute
  '/mentions-legales': typeof MentionsLegalesRoute
  '/confidentialite': typeof ConfidentialiteRoute
  '/cgu': typeof CguRoute
  '/editor/$id': typeof EditorIdRoute
  '/rapport/$id': typeof RapportIdRoute
  '/entreprise/$orgId': typeof EntrepriseOrgIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/app': typeof AppRoute
  '/login': typeof LoginRoute
  '/compte': typeof CompteRoute
  '/admin': typeof AdminRoute
  '/mentions-legales': typeof MentionsLegalesRoute
  '/confidentialite': typeof ConfidentialiteRoute
  '/cgu': typeof CguRoute
  '/editor/$id': typeof EditorIdRoute
  '/rapport/$id': typeof RapportIdRoute
  '/entreprise/$orgId': typeof EntrepriseOrgIdRoute
  '/api/auth/$': typeof ApiAuthSplatRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/app' | '/login' | '/compte' | '/admin' | '/mentions-legales' | '/confidentialite' | '/cgu' | '/editor/$id' | '/rapport/$id' | '/entreprise/$orgId' | '/api/auth/$'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/app' | '/login' | '/compte' | '/admin' | '/mentions-legales' | '/confidentialite' | '/cgu' | '/editor/$id' | '/rapport/$id' | '/entreprise/$orgId' | '/api/auth/$'
  id: '__root__' | '/' | '/app' | '/login' | '/compte' | '/admin' | '/mentions-legales' | '/confidentialite' | '/cgu' | '/editor/$id' | '/rapport/$id' | '/entreprise/$orgId' | '/api/auth/$'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AppRoute: typeof AppRoute
  LoginRoute: typeof LoginRoute
  CompteRoute: typeof CompteRoute
  AdminRoute: typeof AdminRoute
  MentionsLegalesRoute: typeof MentionsLegalesRoute
  ConfidentialiteRoute: typeof ConfidentialiteRoute
  CguRoute: typeof CguRoute
  EditorIdRoute: typeof EditorIdRoute
  RapportIdRoute: typeof RapportIdRoute
  EntrepriseOrgIdRoute: typeof EntrepriseOrgIdRoute
  ApiAuthSplatRoute: typeof ApiAuthSplatRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/app': { id: '/app'; path: '/app'; fullPath: '/app'; preLoaderRoute: typeof AppRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
    '/compte': { id: '/compte'; path: '/compte'; fullPath: '/compte'; preLoaderRoute: typeof CompteRouteImport; parentRoute: typeof rootRouteImport }
    '/admin': { id: '/admin'; path: '/admin'; fullPath: '/admin'; preLoaderRoute: typeof AdminRouteImport; parentRoute: typeof rootRouteImport }
    '/mentions-legales': { id: '/mentions-legales'; path: '/mentions-legales'; fullPath: '/mentions-legales'; preLoaderRoute: typeof MentionsLegalesRouteImport; parentRoute: typeof rootRouteImport }
    '/confidentialite': { id: '/confidentialite'; path: '/confidentialite'; fullPath: '/confidentialite'; preLoaderRoute: typeof ConfidentialiteRouteImport; parentRoute: typeof rootRouteImport }
    '/cgu': { id: '/cgu'; path: '/cgu'; fullPath: '/cgu'; preLoaderRoute: typeof CguRouteImport; parentRoute: typeof rootRouteImport }
    '/editor/$id': { id: '/editor/$id'; path: '/editor/$id'; fullPath: '/editor/$id'; preLoaderRoute: typeof EditorIdRouteImport; parentRoute: typeof rootRouteImport }
    '/rapport/$id': { id: '/rapport/$id'; path: '/rapport/$id'; fullPath: '/rapport/$id'; preLoaderRoute: typeof RapportIdRouteImport; parentRoute: typeof rootRouteImport }
    '/entreprise/$orgId': { id: '/entreprise/$orgId'; path: '/entreprise/$orgId'; fullPath: '/entreprise/$orgId'; preLoaderRoute: typeof EntrepriseOrgIdRouteImport; parentRoute: typeof rootRouteImport }
    '/api/auth/$': { id: '/api/auth/$'; path: '/api/auth/$'; fullPath: '/api/auth/$'; preLoaderRoute: typeof ApiAuthSplatRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  AppRoute,
  LoginRoute,
  CompteRoute,
  AdminRoute,
  MentionsLegalesRoute,
  ConfidentialiteRoute,
  CguRoute,
  EditorIdRoute,
  RapportIdRoute,
  EntrepriseOrgIdRoute,
  ApiAuthSplatRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}
