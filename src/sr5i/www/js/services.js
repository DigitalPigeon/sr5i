angular.module('starter.services', [])

.factory('initiativeManagerService', ['domain$Character', function (domain$Character) {
  return {
    
  actingCharacter: function(characters) {
      
      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);
      if (characters.length > 0 && characters[0].initiative > 0) {
          return this.charactersInActionOrder(characters)[0];
      }
      return null;
  },

  currentInitiative: function (characters) {

      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);

      if (characters.length > 0) {
          return characters[0].initiative;
      } else {
          return 0;
      }
  },

  currentPass: function (characters) {

      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);

      if (characters.length > 0) {
          return characters[0].pass;
      } else {
          return 1;
      }
  },

  currentTurn: function (characters) {

      characters = characters || domain$Character.retrieveAll();
      characters = this.charactersInActionOrder(characters);

      if (characters.length > 0) {
          return characters[0].turn;
      } else {
          return 1;
      }
  },

  charactersInActionOrder: function(characters) {

      characters = characters || domain$Character.retrieveAll();

      characters.sort(function(a, b) {

          //first order by turn, future turns MUST be last
          if (a.turn > b.turn) { return 1; }
          if (a.turn < b.turn) { return -1; }
          
          //then order by 0 initiatives. 0 must always be first
          if (a.initiative == 0) { return 1; }
          if (b.initiative == 0) { return -1; }
          
          //now order by pass. those behind on passes should be first
          if (a.pass > b.pass) { return 1; }
          if (a.pass < b.pass) { return -1; }

          //finally order by initiative, order from highest to lowest
          if (a.initiative > b.initiative) { return -1; }
          if (a.initiative < b.initiative) { return 1; }

          return 0;

      });

      return characters;
  },

  takeTurn: function (character, newInitiativeScore, isNewCombat) {

      //events don't take passes or turns
      if (character.isEvent) {
          return character;
      }

      character.initiative = parseInt(newInitiativeScore);
      character.pass = 1;
      if (isNewCombat) {
          character.turn = 1;
      } else {
          character.turn++;    
      }
      
      return character;
  },

  takePass: function (character) {

      //events don't take passes or turns
      if (character.isEvent) {
          character.initiative = 0;
          return character;
      }
      
      var passCost = 10;
      
      //lower bound of 0 initiative
      if (character.initiative - passCost < 0) {
          character.initiative = 0;
      } else {
          character.initiative = parseInt(character.initiative) - 10;
          character.pass++;
      }

      character.effects = [];
      
      return character;
  },

  applyInterupt: function (character, interupt) {

      if (interupt.initiative || interupt.initiative == 0) {
          character.initiative = parseInt(interupt.initiative) + parseInt(character.initiative);
      }

      //lower bound of 0 initiative
      if (character.initiative < 0) {
          character.initiative = 0;
      }

      //persist if required
      if (interupt.persist) {
          character.effects.push(interupt.name);
      }
      
      return character;
  }
};

} ])


.factory('characterOptionsService', [function() {
    
    return{
        



    };

}])


;
