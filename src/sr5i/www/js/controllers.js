angular.module('starter.controllers', [])


    .controller('AppController', function ($rootScope, $scope, $state, $ionicPopup, domain$Character) {

            var characterOptionsPopup;

            $scope.addCharacter = function() {
                $ionicPopup.prompt({title:'Character Name'})
                    .then(function(result) {
                    if (result) {
                        domain$Character.persist({name: result, initiative: null});
                    }
                });
            };

            $scope.showCharacterOptions = function (character) {
                $state.go('app.characterOptions', {characterId: character.id});
            };
            
        })

    .controller('TrackerController', function ($scope, domain$Character) {

    

        $scope.$on('$ionicView.enter', function() {
                $scope.characters = domain$Character.retrieveAll();
        });

    })

    .controller('CharacterOptionsController', function ($rootScope, $scope, $stateParams, $ionicPopup, domain$Character) {

        $scope.character = domain$Character.retrieve($stateParams.characterId);

        console.log($scope.character);
        
        console.log($scope.character.name);
        
        $scope.deleteCharacter = function (character) {

            $ionicPopup.confirm({ title: 'Delete ' + character.name + '?' })
                    .then(function (result) {
                        if (result) {
                            domain$Character.del(character.id);
                            $rootScope.$ionicGoBack();
                        }
                    });

        };

            $scope.addInterupt = function (character, interupt) {

            character.initiative += interupt.initiative;
            domain$Character.persist(character);
            
            $rootScope.$ionicGoBack();

        };
           

        })

        

;



