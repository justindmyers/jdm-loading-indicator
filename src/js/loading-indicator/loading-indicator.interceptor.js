(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .factory('loadingIndicatorInterceptor', LoadingIndicatorInterceptor);

    LoadingIndicatorInterceptor.$inject = ['$q', '$templateCache', 'loadingIndicator', ];

    function LoadingIndicatorInterceptor($q, $templateCache, loadingIndicator) {
        return { 
            request: request,
            response: response,
            responseError: responseError 
        };

        // Exposed Functions
        function request(config) {
            checkRequest(config);
            return config;
        }
        
        function response(response) {
            checkResponse(response);
            return response;
        }
        
        function responseError(rejection) {
            checkResponse(rejection);
            return $q.reject(rejection);
        }
        
        // Internal Functions
        function checkResponse(response) {
            if (response !== undefined) {
                loadingIndicator.setLoadingState(false, response.config);
            }
        }

        function checkRequest(config) {
            // If the request is a get and the request url is not in $templateCache
            if (config.method === 'GET') {
                if ($templateCache.get(config.url) === undefined) {
                    loadingIndicator.setLoadingState(true, config);
                }
            } else {
                loadingIndicator.setLoadingState(true, config);
            }
        }  
    }
})();