angular.module('starter.controllers', [])


    .controller('AppController', function ($rootScope, $scope, $state, $ionicPopup, $ionicHistory, db, domain$Character, initiativeManagerService) {

        $scope.goBack = function() {
            $rootScope.$ionicGoBack();        
        };

        $scope.actingCharacter = function() {
            return initiativeManagerService.actingCharacter(domain$Character.retrieveAll());
        }

        $scope.reloadHome = function() {

            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            
            $state.go('app.tracker', null, { reload: true });    
        };

        $scope.clearEverything = function() {
            $ionicPopup.confirm({ title: 'Clear everything?', subTitle: 'This cannot be undone.' })
                .then(function (result) {
                    if (result) {
                        db.reset();
                        $scope.reloadHome();    
                    }
                });
        };

        $scope.menuEvent = function(eventName, eventParams) {
            $scope.$broadcast(eventName, eventParams);
        };

    })

    .controller('TrackerController', function ($scope, $state, $q, $ionicPopup, $ionicListDelegate, domain$Character, initiativeManagerService) {

        var rebind = function() {
            $scope.characters = initiativeManagerService.charactersInActionOrder(domain$Character.retrieveAll());
        };

        $scope.$on('$ionicView.enter', function() {
            rebind();
        });

        $scope.$on('newCombat', function () {
            $scope.rollInitiative(true);
        });

        $scope.$on('addSomething', function () {
            $scope.addCharacter();
        });

        $scope.addCharacter = function () {
            $state.go('app.addCharacter');
        };

        $scope.getStyleIfCharacterIsInactiveThisPass = function (character) {
            var currentPass = initiativeManagerService.currentPass();
            
            if (character.initiative == 0 || character.pass != currentPass || character.turn > 0) {
                return { 'opacity': 0.5 };
            }
        };

        $scope.showCharacterOptions = function (character) {
            $state.go('app.characterOptions', { characterId: character.id });
        };

        $scope.rollInitiative = function (isNewCombat) {
            var characters = domain$Character.retrieveAll();

            var rollAll = function () {

                var deferred = $q.defer();
                var rolledCount = 0;

                angular.forEach(characters, function (character) {

                    if (!character.isEvent) {
                        $ionicPopup.prompt({ title: character.name + "'s" + ' initiative?' })
                            .then(function (result) {
                                deferred.notify(character.name);
                                if (result) {
                                    character = initiativeManagerService.takeTurn(character, result, isNewCombat);
                                    domain$Character.persist(character);
                                }

                                rolledCount++;
                                if (rolledCount == characters.length) {
                                    deferred.resolve(rolledCount);
                                }
                            });
                    }
                    //deal with the event
                    else {
                        rolledCount++;
                        
                        if (!isNewCombat) {
                            character = initiativeManagerService.takeTurn(character);
                            domain$Character.persist(character);
                        } else {
                            domain$Character.del(character.id);
                        }
                        
                        if (rolledCount == characters.length) {
                            deferred.resolve(rolledCount);
                        }
                    }
                });

                return deferred.promise;
            };

            rollAll()
            .then(function (result) {
                rebind();
            });
        };

        $scope.deleteCharacter = function (character) {

            $ionicPopup.confirm({ title: 'Delete ' + character.name + '?', subTitle: 'This cannot be undone.' })
                    .then(function (result) {
                        if (result) {
                            domain$Character.del(character.id);
                            rebind();
                        }
                        $ionicListDelegate.closeOptionButtons();
                    });
        };

        
        $scope.setInitiative = function (character) {

            $ionicPopup.prompt({ title: 'New initiative score for ' + character.name + '?', defaultText: character.initiative, inputType: 'number' })
            .then(function (result) {
                if (result) {
                    character.initiative = result;
                    domain$Character.persist(character);
                    rebind();
                }
                $ionicListDelegate.closeOptionButtons();
            });
        };



        $scope.activeCharacterTakesPass = function () {
            var actingCharacter = $scope.actingCharacter();

            if (actingCharacter.isEvent) {
                $ionicPopup.alert({ title: actingCharacter.name + ' Occurs!', subTitle: 'This event is now complete.' })
                    .then(function () {
                        domain$Character.del(actingCharacter.id);
                        rebind();
                    });
            } else {
                initiativeManagerService.takePass(actingCharacter);
                domain$Character.persist(actingCharacter);
                rebind();

            }
        };

    })

    .controller('CharacterOptionsController', function ($rootScope, $scope, $state, $stateParams, $ionicPopup, domain$Character, initiativeManagerService) {


        $scope.$on('$ionicView.enter', function() {
            $scope.character = domain$Character.retrieve($stateParams.characterId);
        });
        
        $scope.deleteCharacter = function (character) {

            $ionicPopup.confirm({ title: 'Delete ' + character.name + '?', subTitle: 'This cannot be undone.' })
                    .then(function (result) {
                        if (result) {
                            domain$Character.del(character.id);
                            $rootScope.$ionicGoBack();
                        }
                    });

        };

        $scope.editCharacter = function(character) {
            $state.go('app.editCharacter', {characterId: character.id});
        };


        $scope.addInterupt = function (character, interupt) {

            if (interupt.initiative == undefined) {

                $ionicPopup.prompt({ title: 'Initiative Cost?',  })
                            .then(function (result) {
                                if (result) {

                                    if (result > 0) {
                                        result = result * -1;
                                    }

                                    interupt.initiative = result;
                                    initiativeManagerService.applyInterupt(character, interupt);
                                    domain$Character.persist(character);
                                    $rootScope.$ionicGoBack();
                                }
                            });

            }
            else
            {
                initiativeManagerService.applyInterupt(character, interupt);
                domain$Character.persist(character);
                $rootScope.$ionicGoBack();
            }
            
        };
           

    })


    .controller('AddCharacterController', function ($scope, domain$Character, initiativeManagerService  ) {

        $scope.$on('$ionicView.enter', function () {
            $scope.character = { name: '', initiative: '', eventThisPass: false, eventNextPass: false };

            $scope.currentInitiative = initiativeManagerService.currentInitiative();
            $scope.currentPass = initiativeManagerService.currentPass();

        });

        $scope.create = function (eventOffset) {

            //if scheduled for next turn, then it will occur on the first pass of that turn
            var currentPass = $scope.currentPass;

            var pass = !eventOffset ? currentPass : (currentPass + eventOffset.pass);

            //special case, if the triggering turn is in the future, then that pass must be 1st (since its a new turn)
            if (eventOffset && eventOffset.delayTurn) {
                pass = 1;
            }

            domain$Character.persist({ name: $scope.character.name,
                initiative: $scope.character.initiative, pass: pass, turn: (eventOffset && eventOffset.delayTurn) ? 1 : 0,
                isEvent: eventOffset != undefined,
                effects: []
            });
            $scope.reloadHome();

        }

    })


    .controller('EditCharacterController', function ($scope, $stateParams, domain$Character, initiativeManagerService) {

        $scope.$on('$ionicView.enter', function () {

            var characterId = $stateParams.characterId;
            $scope.character = domain$Character.retrieve(characterId);
        });

        $scope.update = function (character) {
            domain$Character.persist(character);
            $scope.reloadHome();
        }

    })
        

;



