define([
    '../BaseStore',
    '../Stores',
    '../../data/User'
], function(BaseStore,
            Stores,
            User){
    "use strict";
    var users;

    /**
     * Store for retrieval of users from the API.
     * @augments BaseStore
     * @constructor
     * @alias Users
     */
    var Users = function() {
        BaseStore.apply(this, arguments);
    };

    Users.prototype = Object.create(BaseStore.prototype);

    /**
     * @inheritDoc
     */
    Users.prototype.getInstance = function(layerData) {
        return new User({data: layerData});
    };

    /**
     * @inheritDoc
     */
    Users.prototype.getPath = function() {
        return "rest/user";
    };

    /**
     * It shares current state of the application with a user. This means that the user will have access to all
     * permission protected parts of the application.
     * @param user {Number} Id of the user to share the data with
     * @param scope {Number} Id of the scope to share with the group
     * @param places {Number[]} Array of ids of places to share with the user.
     */
    Users.prototype.share = function(user, scope, places) {
        if(!user) {
            return Promise.resolve(null);
        }

        return $.post(Config.url + 'rest/share/user', {
            user: user,
            scope: scope,
            places: places
        });
    };

    if(!users) {
        users = new Users();
        Stores.register('user', users);
    }
    return users;
});