(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .factory('loadingIndicatorInterceptor', LoadingIndicatorInterceptor);

    LoadingIndicatorInterceptor.$inject = ['$q', '$templateCache', 'loadingIndicator', '$timeout'];

    function LoadingIndicatorInterceptor($q, $templateCache, loadingIndicator, $timeout) {
        var waitingRequests = [];

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

                for(var x = waitingRequests.length - 1; x >= 0 ; x--) {
                    if(waitingRequests[x] === response.config) {
                        waitingRequests.splice(x, 1);
                    }
                }
            }
        }

        function checkRequest(config) {
            // If the request is a get and the request url is not in $templateCache
            if (config.method === 'GET' || config.method === 'JSONP') {
                if ($templateCache.get(config.url) === undefined) {
                    waitForThreshold(config);
                }
            } else {
                waitForThreshold(config);
            }
        }

        function waitForThreshold(config) {
            waitingRequests.push(config);

            $timeout(function() {
                for(var x = 0; x < waitingRequests.length; x++) {
                    if(config === waitingRequests[x]) {
                        loadingIndicator.setLoadingState(true, config);
                    }
                }
            }, loadingIndicator.threshold);
        }
    }
})();