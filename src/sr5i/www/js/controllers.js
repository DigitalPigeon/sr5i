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

        $scope.clearDatabase = function() {
            $ionicPopup.confirm({ title: 'Reset the database?', subTitle: 'This will remove all custom saved data. This cannot be undone.' })
                .then(function (result) {
                    if (result) {
                        db.reset();
                        $scope.reloadHome();    
                    }
                });
        };

        $scope.clearInitiaitveTrack = function () {
            $ionicPopup.confirm({ title: 'Clear the initiative track?', subTitle: 'This cannot be undone.' })
            .then(function (result) {
                if (result) {
                    var characters = domain$Character.retrieveAll();

                    for (var index = 0; index < characters.length; index++) {
                        domain$Character.del(characters[index].id);
                    }

                    $scope.reloadHome();    
                }
            });
        };

        $scope.menuEvent = function(eventName, eventParams) {
            $scope.$broadcast(eventName, eventParams);
        };

    })

    .controller('TrackerController', function ($scope, $state, $q, $timeout, $ionicPopup, $ionicModal, $ionicListDelegate, domain$Character, initiativeManagerService) {

        var rebind = function() {
            $scope.characters = initiativeManagerService.charactersInActionOrder(domain$Character.retrieveAll());
            $ionicListDelegate.closeOptionButtons();
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

        var pendingRefresh;

        $scope.addInitiative = function (character, amount) {

            character.initiative += amount;
            if (character.initiative <0)
            {
                character.initiative = 0;
            }
            domain$Character.persist(character);

            if (pendingRefresh)
            {
                $timeout.cancel(pendingRefresh);
            }

            pendingRefresh = $timeout(rebind, 1500);

        };

        $scope.quickAddCharacter = function () {

            $ionicPopup.prompt({ title: 'Quick Add', subTitle:'Add as many names as you like', inputType: 'text', templateUrl: 'templates/common/fixedPromptText.html' })
                            .then(function (result) {
                                if (result) {

                                    var pass = initiativeManagerService.currentPass();
                                    
                                    domain$Character.persist({ name: result,
                                        initiative: 0, pass: pass, turn: 0,
                                        isEvent: false,
                                        effects: []
                                    });
                                    rebind();
                                    $scope.quickAddCharacter();
                                }
                            });

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
            
            var deferred = $q.defer();

            var rollAll = function (characterList, index) {
                
                //if we have completely recursed
                if (index >= characterList.length) {
                    deferred.resolve('Completed');
                } 
                //recursing still exists
                else {

                    var character = characterList[index];

                    deferred.notify(character.name);

                    if (!character.isEvent) {
                        $ionicPopup.prompt({ title: character.name + "'s" + ' initiative?', inputType: 'number', templateUrl:'templates/common/fixedPrompt.html' })
                            .then(function(result) {
                                if (result) {
                                    character = initiativeManagerService.takeTurn(character, result, isNewCombat);
                                    domain$Character.persist(character);
                                    rollAll(characterList, index + 1);
                                } else {
                                    deferred.resolve('Canceled by user');
                                    //deferred.reject('Canceled by user');
                                }
                            });
                    }
                    //deal with the event
                    else {

                        if (!isNewCombat) {
                            character = initiativeManagerService.takeTurn(character);
                            domain$Character.persist(character);
                        } else {
                            domain$Character.del(character.id);
                        }

                        rollAll(characterList, index + 1);
                    }

                    if (index == 0) {
                        return deferred.promise;
                    }
                }
            };

            rollAll(domain$Character.retrieveAll(), 0)
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

            $ionicPopup.prompt({ title: 'New initiative score for ' + character.name + '?', defaultText: character.initiative, inputType: 'number', templateUrl:'templates/common/fixedPrompt.html' })
            .then(function (result) {
                if (result) {

                    //if the character was out of initiative, then change his pass to be the current pass, otherwise
                    //he would jump ahead of other characters
                    if ( !character.isEvent && (character.initiative == 0 || result > 0)) {
                        character.pass = initiativeManagerService.currentPass();
                    }
                    
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
                characters = initiativeManagerService.takePass(actingCharacter);

                for (var count = 0; count < characters.length; count++)
                {
                    if (characters[count])
                    {
                        console.log('save ' + characters[count].name);
                        domain$Character.persist(characters[count]);
                    }
                }                
                rebind();
            }
        };

    })

    .controller('CharacterOptionsController', function ($rootScope, $scope, $state, $stateParams, $ionicPopup, $ionicListDelegate, 
                                                            domain$Character, domain$Interrupt, initiativeManagerService) {

        
        var rebind = function() {
            $scope.character = domain$Character.retrieve($stateParams.characterId);
            $scope.customInterrupts = domain$Interrupt.retrieveAll();
        }

        $scope.$on('$ionicView.enter', function() {
            rebind();
            $ionicListDelegate.closeOptionButtons();
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

        $scope.addInterrupt = function (character) {
            $state.go('app.addCustomInterrupt', { characterId: character.id });
            $ionicListDelegate.closeOptionButtons();
        };

        $scope.deleteCustomInterrupt = function (interrupt) {

            $ionicPopup.confirm({ title: 'Delete ' + interrupt.name + '?', subTitle: 'This cannot be undone.' })
                    .then(function (result) {
                        if (result) {
                            domain$Interrupt.del(interrupt.id);
                            rebind();
                        }
                    });

            $ionicListDelegate.closeOptionButtons();
        };


        $scope.quickAddInterrupt = function (character, interrupt) {

            if (interrupt.initiative == undefined) {

                $ionicPopup.prompt({ title: 'Initiative Cost?', inputType: 'number', templateUrl: 'templates/common/fixedPrompt.html' })
                            .then(function (result) {
                                if (result) {

                                    if (result > 0) {
                                        result = result * -1;
                                    }

                                    interrupt.initiative = result;
                                    initiativeManagerService.applyInterrupt(character, interrupt);
                                    domain$Character.persist(character);
                                    $rootScope.$ionicGoBack();
                                }
                            });

            }
            else
            {
                initiativeManagerService.applyInterrupt(character, interrupt);
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



    .controller('AddCustomInterruptController', function ($scope, $stateParams, domain$Character, domain$Interrupt, initiativeManagerService) {

        $scope.$on('$ionicView.enter', function () {

            var characterId = $stateParams.characterId;
            $scope.character = domain$Character.retrieve(characterId);
            $scope.interrupt = { name: '', initiative: null, persist: false };
        });

        $scope.applyAndSave = function () {

            $scope.interrupt.initiative = ($scope.interrupt.initiative > 0)
                ? $scope.interrupt.initiative = $scope.interrupt.initiative * -1
                : $scope.interrupt.initiative;

            if ($scope.interrupt.name && ($scope.interrupt.initiative || $scope.interrupt.initiative == 0))
            {
                initiativeManagerService.applyInterrupt($scope.character, $scope.interrupt);
                domain$Character.persist($scope.character);

                domain$Interrupt.persist($scope.interrupt);

                $scope.reloadHome();

            }
        }
    })

;



