"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/initiate-payment/route";
exports.ids = ["app/api/initiate-payment/route"];
exports.modules = {

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finitiate-payment%2Froute&page=%2Fapi%2Finitiate-payment%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finitiate-payment%2Froute.ts&appDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finitiate-payment%2Froute&page=%2Fapi%2Finitiate-payment%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finitiate-payment%2Froute.ts&appDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_wingfungyeung_Desktop_ethglobal_taipei_MapMint_app_api_initiate_payment_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/initiate-payment/route.ts */ \"(rsc)/./app/api/initiate-payment/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/initiate-payment/route\",\n        pathname: \"/api/initiate-payment\",\n        filename: \"route\",\n        bundlePath: \"app/api/initiate-payment/route\"\n    },\n    resolvedPagePath: \"/Users/wingfungyeung/Desktop/ethglobal/taipei/MapMint/app/api/initiate-payment/route.ts\",\n    nextConfigOutput,\n    userland: _Users_wingfungyeung_Desktop_ethglobal_taipei_MapMint_app_api_initiate_payment_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/initiate-payment/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvLnBucG0vbmV4dEAxNC4yLjZfcmVhY3QtZG9tQDE4LjMuMV9yZWFjdEAxOC4zLjFfX3JlYWN0QDE4LjMuMS9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZpbml0aWF0ZS1wYXltZW50JTJGcm91dGUmcGFnZT0lMkZhcGklMkZpbml0aWF0ZS1wYXltZW50JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGaW5pdGlhdGUtcGF5bWVudCUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRndpbmdmdW5neWV1bmclMkZEZXNrdG9wJTJGZXRoZ2xvYmFsJTJGdGFpcGVpJTJGTWFwTWludCUyRmFwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9JTJGVXNlcnMlMkZ3aW5nZnVuZ3lldW5nJTJGRGVza3RvcCUyRmV0aGdsb2JhbCUyRnRhaXBlaSUyRk1hcE1pbnQmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ3VDO0FBQ3BIO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXBwLXJvdXRlci10ZW1wbGF0ZS8/MTM0MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvd2luZ2Z1bmd5ZXVuZy9EZXNrdG9wL2V0aGdsb2JhbC90YWlwZWkvTWFwTWludC9hcHAvYXBpL2luaXRpYXRlLXBheW1lbnQvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2luaXRpYXRlLXBheW1lbnQvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9pbml0aWF0ZS1wYXltZW50XCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9pbml0aWF0ZS1wYXltZW50L3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL3dpbmdmdW5neWV1bmcvRGVza3RvcC9ldGhnbG9iYWwvdGFpcGVpL01hcE1pbnQvYXBwL2FwaS9pbml0aWF0ZS1wYXltZW50L3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9pbml0aWF0ZS1wYXltZW50L3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finitiate-payment%2Froute&page=%2Fapi%2Finitiate-payment%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finitiate-payment%2Froute.ts&appDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/initiate-payment/route.ts":
/*!*******************************************!*\
  !*** ./app/api/initiate-payment/route.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/headers.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/server.js\");\n\n\nasync function POST(req) {\n    const uuid = crypto.randomUUID().replace(/-/g, \"\");\n    // TODO: Store the ID field in your database so you can verify the payment later\n    (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)().set({\n        name: \"payment-nonce\",\n        value: uuid,\n        httpOnly: true\n    });\n    console.log(uuid);\n    return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n        id: uuid\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2luaXRpYXRlLXBheW1lbnQvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXVDO0FBQ2lCO0FBRWpELGVBQWVFLEtBQUtDLEdBQWdCO0lBQ3pDLE1BQU1DLE9BQU9DLE9BQU9DLFVBQVUsR0FBR0MsT0FBTyxDQUFDLE1BQU07SUFFL0MsZ0ZBQWdGO0lBQ2hGUCxxREFBT0EsR0FBR1EsR0FBRyxDQUFDO1FBQ1pDLE1BQU07UUFDTkMsT0FBT047UUFDUE8sVUFBVTtJQUNaO0lBRUFDLFFBQVFDLEdBQUcsQ0FBQ1Q7SUFFWixPQUFPSCxxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO1FBQUVDLElBQUlYO0lBQUs7QUFDdEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hcHAtcm91dGVyLXRlbXBsYXRlLy4vYXBwL2FwaS9pbml0aWF0ZS1wYXltZW50L3JvdXRlLnRzPzBjMDkiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY29va2llcyB9IGZyb20gXCJuZXh0L2hlYWRlcnNcIjtcbmltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCB1dWlkID0gY3J5cHRvLnJhbmRvbVVVSUQoKS5yZXBsYWNlKC8tL2csIFwiXCIpO1xuXG4gIC8vIFRPRE86IFN0b3JlIHRoZSBJRCBmaWVsZCBpbiB5b3VyIGRhdGFiYXNlIHNvIHlvdSBjYW4gdmVyaWZ5IHRoZSBwYXltZW50IGxhdGVyXG4gIGNvb2tpZXMoKS5zZXQoe1xuICAgIG5hbWU6IFwicGF5bWVudC1ub25jZVwiLFxuICAgIHZhbHVlOiB1dWlkLFxuICAgIGh0dHBPbmx5OiB0cnVlLFxuICB9KTtcblxuICBjb25zb2xlLmxvZyh1dWlkKTtcblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBpZDogdXVpZCB9KTtcbn1cbiJdLCJuYW1lcyI6WyJjb29raWVzIiwiTmV4dFJlc3BvbnNlIiwiUE9TVCIsInJlcSIsInV1aWQiLCJjcnlwdG8iLCJyYW5kb21VVUlEIiwicmVwbGFjZSIsInNldCIsIm5hbWUiLCJ2YWx1ZSIsImh0dHBPbmx5IiwiY29uc29sZSIsImxvZyIsImpzb24iLCJpZCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/initiate-payment/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@14.2.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finitiate-payment%2Froute&page=%2Fapi%2Finitiate-payment%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finitiate-payment%2Froute.ts&appDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fwingfungyeung%2FDesktop%2Fethglobal%2Ftaipei%2FMapMint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();