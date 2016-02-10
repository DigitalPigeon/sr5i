var domain = function (db, table, columns)
{
    return {

        retrieve: function (key) {
            var item = db.select(table, key);
            return item;
        },

        retrieveAll: function () {
            var items = db.select(table);
            return items;
        },

        del: function (key) {
            db.del(table, key);
            return;
        },

        persist: function (item) {

            angular.forEach(columns, function (column) {
                if (!item.hasOwnProperty(column))
                { throw ('Entity ' + table + ' requires a property of ' + column); }
            });
            
            if (!item.id) {
                item.id = db.nextId(table);
                db.insert(table, item.id, item);
            }
            else {
                db.update(table, item.id, item);
            }

            return item;
        }
    }
};

angular.module('starter.domain', [])



.factory('domain$Character', ['db', function (db) {

    var table = 'character';
    
    var columns = ['name', 'initiative', 'pass'];

    return domain(db, table, columns);

    }])


;
