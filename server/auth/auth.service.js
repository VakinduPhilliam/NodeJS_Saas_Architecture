(function () {
  

'use strict';

  

var mongoose = require('mongoose');
  
var passport = require('passport');
  
var config = require('../config/environment');
  
var jwt = require('jsonwebtoken');
  
var expressJwt = require('express-jwt');
  
var compose = require('composable-middleware');
  
var UsersServiceSeq = require('../api/user/user.service.seq');
  
var validateJwt = expressJwt({ secret: config.secrets.session });

  

/**
   
* Attaches the user object to the request if authenticated
   
* Otherwise returns 403
   
*/
  

function isAuthenticated() {
    

return compose()
      

// Validate 

jwt.use(function(req, res, next) {
        

// allow access_token to be passed through query parameter as well
        

if (req.query && req.query.hasOwnProperty('access_token')) {
          

req.headers.authorization = 'Bearer ' + req.query.access_token;
        

}
        

validateJwt(req, res, next);
      

})
      

// Handle error on validateJwt
.use(function (err, req, res, next) {
        

if (err.name === 'UnauthorizedError') {
          

res.send(401, 'Invalid token');
        

  }
      

})
      

// Attach user to request
      

.use(function(req, res, next) {
        

UsersServiceSeq.getById(req.user.id)
.then(function (user) {
            

if (!user) return res.status(401).send('Unauthorized');
            

req.user = user;
            

next();

          

}, function (err) {
            

return next(err);


          });


      });


  }

  

/**
   
* Checks if the user role meets the minimum requirements of the route
   
*/
  

function hasRole(roleRequired) {
    

if (!roleRequired) throw new Error('Required role needs to be set');

    

return compose()
 .use(isAuthenticated())
 .use(function meetsRequirements(req, res, next) {
        

if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
          

next();
        

}
 else {
          

res.status(403).send('Forbidden');


        }


      });


  }

  

/**
   
* Returns a jwt token signed by the app secret
   
*/
  

function signToken(id) {
    

return jwt.sign({ id: id }, config.secrets.session, { 

expiresInMinutes: 60*5 

});
  

}

  

/**
   
* Set token cookie directly for oAuth strategies
   
*/
  function setTokenCookie(req, res) {
    

if (!req.user) return res.status(404).json({ message: 'Something went wrong, please try again.'});
    

var token = signToken(req.user.id, req.user.role);
    

res.cookie('token', JSON.stringify(token));
    

res.redirect('/');


  }

  

exports.isAuthenticated = isAuthenticated;
  
exports.hasRole = hasRole;
  
exports.signToken = signToken;
  
exports.setTokenCookie = setTokenCookie;


})();
