/*============ CREATE THE docsApp MODULE AND REGISTER FACTORIES, DIRECTIVES, CONTROLLERS ============*/

angular.module('docsApp', ['ngResource', 'ngCookies', 'ngSanitize', 'ui.bootstrap']).
    config(function($locationProvider, $provide) {
        $provide.decorator('$sniffer', function($delegate) {
          $delegate.history = false;
          return $delegate;
        });

        $locationProvider.html5Mode(true);
    })
    .factory(docsApp.serviceFactory)
    .directive(docsApp.directive)
    .controller(docsApp.controller);
