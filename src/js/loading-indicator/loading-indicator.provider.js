(function() {
    'use strict';

    angular
        .module('jdm.loadingIndicator')
        .provider('loadingIndicator', LoadingIndicatorProvider);
        
    function LoadingIndicatorProvider() {
        var referenceId = 0,
            threshold = 250,
            position = 'left';
            
        this.setDefaultReferenceId = function(defaultId) {
            referenceId = defaultId;
        };
        
        this.setDefaultPosition = function(defaultPosition) {
            position = defaultPosition;
        };
        
        this.setThreshold = function(defaultThreshold) {
            threshold = defaultThreshold;
        };

        this.$get = LoadingIndicatorService;
        
        LoadingIndicatorService.$inject = ['$timeout', '$rootScope'];
        
        function LoadingIndicatorService($timeout, $rootScope) {            
            var service = {
                directives: {},
                position: position,
                threshold: threshold,
                initDirective: initDirective,
                addLoadingState: addLoadingState,
                deleteLoadingState: deleteLoadingState,
                setLoadingState: setLoadingState
            };
            
            return service;
            
            // Exposed Functions
            function initDirective(referenceId) {
                service.directives[referenceId] = service.directives[referenceId] || preLoad(referenceId);
        
                return service.directives[referenceId];
            }
            
            function addLoadingState(data) {
                var directive = service.directives[data.referenceId] || preLoad(data.referenceId);

                if (data.isLoading) {
                    if (typeof directive.requests === 'undefined') {
                        directive.total = 0;
                        directive.requests = [];
                    }

                    directive.total++;
                    directive.requests.push(data);
                    
                    //Check by referenceID for broadcasts
                    if(directive.requests.length === 1) {
                        $rootScope.$emit('loadingIndicator:started', data);
                    }
                } else {
                    for (var x = 0; x < directive.requests.length; x++) {
                        //if the url's and referenceId's match, delete it
                        if (directive.requests[x].url === data.url && directive.requests[x].referenceId === data.referenceId) {
                            //We only want to destroy one request at a time, so break after
                            directive.requests[x].destroy();
                            directive.total--;
                            break;
                        }
                    }
                }

                return data;
            }

            function deleteLoadingState(data) {
                var requests = service.directives[data.referenceId].requests;
                var index = requests.indexOf(data);
                
                if (index > -1) {
                    requests.splice(index, 1);
                }
                
                if(requests.length === 0) {
                    $rootScope.$emit('loadingIndicator:stopped', data);
                }
            }
            
            function setLoadingState(isLoading, config) {
                var _config = config || {};
                
                if (angular.isUndefined(isLoading)) {
                    return;
                }

                var data = {
                    isLoading: isLoading,
                    url: _config.url,
                    position: _config.position || position,
                    referenceId: _config.referenceId || referenceId,
                    destroy: function() {
                        deleteLoadingState(data);
                    },
                    callTimeout: function() {
                        // Go ahead and remove the call if it passes a certain timeout
                        $timeout(function() {
                            deleteLoadingState(data);
                        }, 10000);
                    }
                };

                data.callTimeout();

                return addLoadingState(data);
            }
            
            function preLoad(referenceId) {
                service.directives[referenceId] = {
                    requests: [],
                    total: 0
                };
                
                return service.directives[referenceId];
            }
        }
    }


})();