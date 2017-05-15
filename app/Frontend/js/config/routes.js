/**
 * Created by Ian on 28/12/2016.
 */
angular.module("stockBotRoutes",[]).config(function($stateProvider){

    //$stateProvider.state('blank', {url: "/#",template: ""}); //rota nula que não redireciona.


    $stateProvider
        .state('candles', {
            url: "/candles",
            //template: '<h3>hello world!</h3>'
            templateUrl: "/view/candleChart",
            controller: 'candleController'
        })
    ;

});