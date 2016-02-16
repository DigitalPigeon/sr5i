angular.module('starter.directives', [])

.directive('irlSwipeBack', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attribute) {

            element.on('swiperight', function (event) {
                scope.goBack();
            });

        }
    };
})

.directive('refocus', function ($timeout) {
    return {
        link: function (scope, element, attrs) {

            $timeout(function () {
                element[0].focus();
            });
        }
    };
});




;
